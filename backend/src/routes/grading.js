import express from 'express';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logActivity } from '../services/gamification.js';

const router = express.Router();
router.use(authenticate);

// GET /api/grade/:studentChallengeId - ดูรายละเอียด + ข้อมูลสำหรับตรวจงาน
router.get('/:studentChallengeId', (req, res) => {
  const sc = db.prepare(`
    SELECT sc.*, c.title as challenge_title, c.max_score,
      u.name as student_name, u.username, u.student_id as student_code,
      g.name as group_name
    FROM student_challenges sc
    JOIN challenges c ON c.id = sc.challenge_id
    JOIN users u ON u.id = sc.student_id
    LEFT JOIN groups g ON g.id = sc.group_id
    WHERE sc.id = ?
  `).get(req.params.studentChallengeId);

  if (!sc) return res.status(404).json({ error: 'ไม่พบข้อมูล' });

  let groupMembers = [];
  if (sc.group_id) {
    groupMembers = db.prepare(`
      SELECT u.id, u.name, u.student_id as student_code
      FROM users u JOIN group_members gm ON gm.student_id = u.id
      WHERE gm.group_id = ?
      ORDER BY u.name
    `).all(sc.group_id);
  }

  const grade     = db.prepare('SELECT * FROM scores WHERE student_challenge_id = ?').get(sc.id);
  const feedback  = db.prepare('SELECT * FROM feedback WHERE student_challenge_id = ?').get(sc.id);
  const submFiles = db.prepare('SELECT * FROM submissions WHERE student_challenge_id = ? ORDER BY submitted_at DESC LIMIT 1').get(sc.id);
  const linkSubm  = db.prepare('SELECT * FROM link_submissions WHERE student_challenge_id = ?').get(sc.id);

  // Checklist ของ challenge นี้พร้อม completion status
  const checklist = db.prepare(`
    SELECT ci.id, ci.item_text, ci.order_num,
      COALESCE(cc.checked, 0) as checked, cc.checked_at
    FROM checklist_items ci
    LEFT JOIN checklist_completions cc ON cc.checklist_item_id = ci.id AND cc.student_challenge_id = ?
    WHERE ci.challenge_id = ?
    ORDER BY ci.order_num
  `).all(sc.id, sc.challenge_id);

  const missions = db.prepare(`
    SELECT m.*, COALESCE(mp.status, 'locked') as progress_status, mp.completed_at
    FROM missions m
    LEFT JOIN mission_progress mp ON mp.mission_id = m.id AND mp.student_challenge_id = ?
    WHERE m.challenge_id = ?
    ORDER BY m.order_num
  `).all(sc.id, sc.challenge_id);

  res.json({
    submission: {
      ...submFiles,
      canva_link: sc.canva_link || linkSubm?.canva_link || null,
      challenge_title: sc.challenge_title,
      max_score: sc.max_score,
      submitted_at: sc.submitted_at || linkSubm?.submitted_at || null,
      submission_status: submFiles?.submission_status || (sc.is_on_time === 0 ? 'late' : 'on_time'),
    },
    student: {
      id: sc.student_id,
      name: sc.student_name,
      username: sc.username,
      student_code: sc.student_code,
      group_id: sc.group_id,
      group_name: sc.group_name,
      groupMembers,
    },
    grade: grade ? { score: grade.score, comment: feedback?.comment || '' } : null,
    checklist,
    missions,
  });
});

// POST /api/grade/init/:challengeId/:studentId - ครูเริ่มตรวจงานให้นักเรียนที่ยังไม่ได้เริ่ม
router.post('/init/:challengeId/:studentId', requireRole('teacher'), (req, res) => {
  const { challengeId, studentId } = req.params;
  let sc = db.prepare('SELECT id FROM student_challenges WHERE challenge_id = ? AND student_id = ?').get(challengeId, studentId);
  if (!sc) {
    const enrollment = db.prepare('SELECT class_id FROM class_enrollments WHERE student_id = ?').get(studentId);
    const groupRow = db.prepare('SELECT g.id FROM groups g JOIN group_members gm ON gm.group_id = g.id WHERE gm.student_id = ? AND g.class_id = ?').get(studentId, enrollment?.class_id);
    const now = new Date().toISOString();
    const scId = db.prepare("INSERT INTO student_challenges (student_id, challenge_id, group_id, status, started_at) VALUES (?, ?, ?, 'in_progress', ?)").run(studentId, challengeId, groupRow?.id || null, now).lastInsertRowid;
    
    // init missions
    const missions = db.prepare('SELECT * FROM missions WHERE challenge_id = ? ORDER BY order_num').all(challengeId);
    missions.forEach((m, i) => {
      db.prepare("INSERT INTO mission_progress (student_challenge_id, mission_id, status) VALUES (?, ?, ?)").run(scId, m.id, i === 0 ? 'in_progress' : 'locked');
    });
    // init checklists
    const items = db.prepare('SELECT * FROM checklist_items WHERE challenge_id = ?').all(challengeId);
    items.forEach(item => {
      db.prepare("INSERT INTO checklist_completions (student_challenge_id, checklist_item_id, checked) VALUES (?, ?, 0)").run(scId, item.id);
    });
    sc = { id: scId };
  }
  res.json({ studentChallengeId: sc.id });
});

// POST /api/grade/:studentChallengeId - ครูให้คะแนน
router.post('/:studentChallengeId', requireRole('teacher'), (req, res) => {
  const { score, comment, applyToGroup = true } = req.body;
  const safe = v => (v === undefined || v === '') ? null : v;

  if (score === undefined || score === null) return res.status(400).json({ error: 'กรุณากรอกคะแนน' });

  const targetSc = db.prepare(`
    SELECT sc.*, c.max_score, c.title as challenge_title
    FROM student_challenges sc
    JOIN challenges c ON c.id = sc.challenge_id
    WHERE sc.id = ?
  `).get(req.params.studentChallengeId);

  if (!targetSc) return res.status(404).json({ error: 'ไม่พบข้อมูล' });

  const numScore = Math.max(0, Math.min(Number(score), targetSc.max_score || 100));

  let scList = [targetSc];
  if (applyToGroup && targetSc.group_id) {
    const groupScs = db.prepare('SELECT * FROM student_challenges WHERE group_id = ? AND challenge_id = ?').all(targetSc.group_id, targetSc.challenge_id);
    if (groupScs.length > 0) scList = groupScs;
  }

  for (const sc of scList) {
    // Upsert คะแนน
    const existing = db.prepare('SELECT id FROM scores WHERE student_challenge_id = ?').get(sc.id);
    if (existing) {
      db.prepare('UPDATE scores SET score=?, teacher_id=?, graded_at=CURRENT_TIMESTAMP WHERE student_challenge_id=?').run(numScore, req.user.id, sc.id);
    } else {
      db.prepare('INSERT INTO scores (student_challenge_id, teacher_id, score, max_score) VALUES (?, ?, ?, ?)').run(sc.id, req.user.id, numScore, targetSc.max_score || 100);
    }

    // Upsert feedback
    const existFeedback = db.prepare('SELECT id FROM feedback WHERE student_challenge_id = ?').get(sc.id);
    if (existFeedback) {
      db.prepare('UPDATE feedback SET comment=?, teacher_id=? WHERE student_challenge_id=?').run(safe(comment), req.user.id, sc.id);
    } else {
      db.prepare('INSERT INTO feedback (student_challenge_id, teacher_id, strengths, improvements, comment) VALUES (?, ?, ?, ?, ?)').run(sc.id, req.user.id, null, null, safe(comment));
    }

    // อัปเดตสถานะ
    db.prepare("UPDATE student_challenges SET status='graded' WHERE id=?").run(sc.id);

    // แจ้งเตือนนักเรียน
    try {
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        sc.student_id, 'ครูตรวจงานแล้ว ✅',
        `ครูตรวจ "${targetSc.challenge_title}" แล้ว คะแนน ${numScore}/${targetSc.max_score || 100}`, 'success'
      );
    } catch(_) {}

    logActivity(req.user.id, 'GRADE_SUBMISSION', 'student_challenge', sc.id, JSON.stringify({ score: numScore }));
  }

  res.json({ message: 'บันทึกคะแนนสำเร็จ', score: numScore, count: scList.length });
});

export default router;
