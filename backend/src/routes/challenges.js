import express from 'express';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { awardXP, checkAndAwardBadges, logActivity } from '../services/gamification.js';

const router = express.Router();
router.use(authenticate);

// GET /api/challenges - Teacher: list all challenges in their class
router.get('/', (req, res) => {
  if (req.user.role === 'teacher') {
    const challenges = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM student_challenges sc WHERE sc.challenge_id = c.id AND sc.status IN ('submitted','graded')) as submitted_count,
        (SELECT COUNT(*) FROM student_challenges sc WHERE sc.challenge_id = c.id AND sc.is_on_time = 1) as on_time_count,
        (SELECT COUNT(*) FROM student_challenges sc WHERE sc.challenge_id = c.id) as total_students,
        (SELECT COUNT(*) FROM missions m WHERE m.challenge_id = c.id) as mission_count
      FROM challenges c
      WHERE c.teacher_id = ? OR c.teacher_id IS NULL OR c.teacher_id = 1
      ORDER BY c.id DESC
    `).all(req.user.id);
    return res.json({ challenges });
  }

  // Student: get challenges for enrolled class (connected directly to teacher challenges)
  const enrollment = db.prepare('SELECT class_id FROM class_enrollments WHERE student_id = ?').get(req.user.id);
  const classId = enrollment?.class_id || 1;

  const challenges = db.prepare(`
    SELECT c.*,
      sc.status as my_status, sc.id as student_challenge_id,
      sc.started_at, sc.submitted_at, sc.is_on_time,
      sc.canva_link,
      s.score,
      f.comment as feedback_comment
    FROM challenges c
    LEFT JOIN student_challenges sc ON sc.challenge_id = c.id AND sc.student_id = ?
    LEFT JOIN scores s ON s.student_challenge_id = sc.id
    LEFT JOIN feedback f ON f.student_challenge_id = sc.id
    WHERE (c.class_id = ? OR c.class_id IS NULL OR c.class_id = 1)
      AND (c.status != 'archived' OR c.status IS NULL)
    ORDER BY c.id DESC
  `).all(req.user.id, classId);

  res.json({ challenges });
});

// GET /api/challenges/:id - Challenge detail
router.get('/:id', (req, res) => {
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'ไม่พบ Challenge' });

  const missions = db.prepare('SELECT * FROM missions WHERE challenge_id = ? ORDER BY order_num').all(challenge.id);
  const checklistItems = db.prepare('SELECT * FROM checklist_items WHERE challenge_id = ? ORDER BY order_num').all(challenge.id);

  let studentProgress = null;
  if (req.user.role === 'student') {
    const sc = db.prepare('SELECT * FROM student_challenges WHERE challenge_id = ? AND student_id = ?').get(challenge.id, req.user.id);
    if (sc) {
      const missionProgress = db.prepare('SELECT * FROM mission_progress WHERE student_challenge_id = ?').all(sc.id);
      const checklistCompletions = db.prepare('SELECT * FROM checklist_completions WHERE student_challenge_id = ?').all(sc.id);
      const scoreRow = db.prepare('SELECT score FROM scores WHERE student_challenge_id = ?').get(sc.id);
      const feedbackRow = db.prepare('SELECT comment FROM feedback WHERE student_challenge_id = ?').get(sc.id);
      studentProgress = { 
        ...sc, 
        score: scoreRow?.score ?? null, 
        feedback_comment: feedbackRow?.comment ?? null, 
        missionProgress, 
        checklistCompletions 
      };
    }
  }

  res.json({ challenge, missions, checklistItems, studentProgress });
});

// POST /api/challenges - Create challenge (teacher only)
router.post('/', requireRole('teacher'), (req, res) => {
  const { title, description, scenario, goals, deliverables, duration_minutes, start_date, deadline, max_score, rubric, difficulty, group_size, missions, checklistItems } = req.body;

  if (!title) return res.status(400).json({ error: 'กรุณากรอกชื่อ Challenge' });

  const classRow = db.prepare('SELECT id FROM classes WHERE teacher_id = ?').get(req.user.id);
  const classId = classRow?.id || 1;

  // แปลง undefined → null เพื่อป้องกัน SQLite binding error
  const safe = (v) => (v === undefined || v === '') ? null : v;

  const initialStatus = req.body.status || 'active';

  const result = db.prepare(`
    INSERT INTO challenges (class_id, teacher_id, title, description, scenario, goals, deliverables, duration_minutes, start_date, deadline, max_score, rubric, difficulty, group_size, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    classId, req.user.id,
    safe(title), safe(description), safe(scenario), safe(goals), safe(deliverables),
    Number(duration_minutes) || 30,
    safe(start_date), safe(deadline),
    Number(max_score) || 100,
    safe(rubric),
    safe(difficulty) || 'medium',
    Number(group_size) || 1,
    initialStatus
  );

  const challengeId = result.lastInsertRowid;

  if (Array.isArray(missions)) {
    const mStmt = db.prepare('INSERT INTO missions (challenge_id, order_num, title, description, xp_reward) VALUES (?, ?, ?, ?, ?)');
    missions.forEach((m, i) => mStmt.run(challengeId, i + 1, safe(m.title) || `Mission ${i+1}`, safe(m.description) || '', Number(m.xp_reward) || 10));
  }

  if (Array.isArray(checklistItems)) {
    const cStmt = db.prepare('INSERT INTO checklist_items (challenge_id, item_text, order_num) VALUES (?, ?, ?)');
    checklistItems.forEach((item, i) => cStmt.run(challengeId, typeof item === 'string' ? item : safe(item.item_text) || '', i + 1));
  }

  logActivity(req.user.id, 'CREATE_CHALLENGE', 'challenge', challengeId, JSON.stringify({ title }));
  res.status(201).json({ message: 'สร้าง Challenge สำเร็จ', challengeId });
});

// POST /api/challenges/:id/publish - Publish challenge
router.post('/:id/publish', requireRole('teacher'), (req, res) => {
  const challenge = db.prepare('SELECT id FROM challenges WHERE id = ? AND teacher_id = ?').get(req.params.id, req.user.id);
  if (!challenge) return res.status(404).json({ error: 'ไม่พบ Challenge' });

  db.prepare("UPDATE challenges SET status = 'active' WHERE id = ?").run(req.params.id);
  logActivity(req.user.id, 'PUBLISH_CHALLENGE', 'challenge', req.params.id);
  res.json({ message: 'เผยแพร่ Challenge สำเร็จ', status: 'active' });
});

// PUT /api/challenges/:id - Update challenge
router.put('/:id', requireRole('teacher'), (req, res) => {
  const { title, description, scenario, goals, deliverables, duration_minutes, start_date, deadline, max_score, rubric, difficulty, group_size, status, missions, checklistItems } = req.body;
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'ไม่พบ Challenge' });

  const safe = (v) => (v === undefined || v === '') ? null : v;

  db.prepare(`
    UPDATE challenges SET 
      title = ?, description = ?, scenario = ?, goals = ?, deliverables = ?,
      duration_minutes = ?, start_date = ?, deadline = ?, max_score = ?,
      rubric = ?, difficulty = ?, group_size = ?, status = ?
    WHERE id = ?
  `).run(
    safe(title) || challenge.title,
    safe(description),
    safe(scenario),
    safe(goals),
    safe(deliverables),
    duration_minutes !== undefined ? (Number(duration_minutes) || 30) : challenge.duration_minutes,
    safe(start_date) || challenge.start_date,
    safe(deadline),
    max_score !== undefined ? (Number(max_score) || 100) : challenge.max_score,
    safe(rubric) || challenge.rubric,
    safe(difficulty) || challenge.difficulty,
    group_size !== undefined ? (Number(group_size) || 1) : challenge.group_size,
    safe(status) || challenge.status || 'active',
    challenge.id
  );

  // อัปเดตขั้นตอน (missions)
  if (Array.isArray(missions)) {
    db.prepare('DELETE FROM missions WHERE challenge_id = ?').run(challenge.id);
    const mStmt = db.prepare('INSERT INTO missions (challenge_id, order_num, title, description, xp_reward) VALUES (?, ?, ?, ?, ?)');
    missions.forEach((m, i) => {
      mStmt.run(challenge.id, i + 1, safe(m.title) || `Mission ${i+1}`, safe(m.description) || '', Number(m.xp_reward) || 10);
    });
  }

  // อัปเดตรายการตรวจสอบ (checklistItems)
  if (Array.isArray(checklistItems)) {
    db.prepare('DELETE FROM checklist_items WHERE challenge_id = ?').run(challenge.id);
    const cStmt = db.prepare('INSERT INTO checklist_items (challenge_id, item_text, order_num) VALUES (?, ?, ?)');
    checklistItems.forEach((item, i) => {
      cStmt.run(challenge.id, typeof item === 'string' ? item : safe(item.item_text) || '', i + 1);
    });
  }

  logActivity(req.user.id, 'UPDATE_CHALLENGE', 'challenge', challenge.id, JSON.stringify({ title }));
  res.json({ message: 'อัปเดต Challenge สำเร็จ', challengeId: challenge.id });
});

// DELETE /api/challenges/:id — ครูลบกิจกรรมพร้อมข้อมูลที่เกี่ยวข้องทั้งหมด
router.delete('/:id', requireRole('teacher'), (req, res) => {
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'ไม่พบกิจกรรมที่ต้องการลบ' });

  try {
    // 1. ดึง student_challenge_id ทั้งหมดเพื่อลบตารางลูกที่เกี่ยวข้อง
    const scRows = db.prepare('SELECT id FROM student_challenges WHERE challenge_id = ?').all(challenge.id);
    const scIds = scRows.map(r => r.id);

    if (scIds.length > 0) {
      const placeholders = scIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM link_submissions WHERE student_challenge_id IN (${placeholders})`).run(...scIds);
      db.prepare(`DELETE FROM scores WHERE student_challenge_id IN (${placeholders})`).run(...scIds);
      db.prepare(`DELETE FROM feedback WHERE student_challenge_id IN (${placeholders})`).run(...scIds);
      db.prepare(`DELETE FROM mission_progress WHERE student_challenge_id IN (${placeholders})`).run(...scIds);
      db.prepare(`DELETE FROM checklist_completions WHERE student_challenge_id IN (${placeholders})`).run(...scIds);
      db.prepare('DELETE FROM student_challenges WHERE challenge_id = ?').run(challenge.id);
    }

    // 2. ลบตารางที่ผูกกับ challenge โดยตรง
    db.prepare('DELETE FROM missions WHERE challenge_id = ?').run(challenge.id);
    db.prepare('DELETE FROM checklist_items WHERE challenge_id = ?').run(challenge.id);
    db.prepare('DELETE FROM group_canva_links WHERE challenge_id = ?').run(challenge.id);
    db.prepare('DELETE FROM challenge_activity WHERE challenge_id = ?').run(challenge.id);
    db.prepare('DELETE FROM challenge_files WHERE challenge_id = ?').run(challenge.id);

    // 3. ลบกิจกรรมหลัก
    db.prepare('DELETE FROM challenges WHERE id = ?').run(challenge.id);

    logActivity(req.user.id, 'DELETE_CHALLENGE', 'challenge', challenge.id, JSON.stringify({ title: challenge.title }));
    res.json({ message: 'ลบกิจกรรมสำเร็จ', deletedId: challenge.id });
  } catch (err) {
    console.error('Delete challenge error:', err);
    res.status(500).json({ error: 'ไม่สามารถลบกิจกรรมได้: ' + err.message });
  }
});

// POST /api/challenges/:id/submit-link — นักเรียนส่งลิงก์ Canva
router.post('/:id/submit-link', requireRole('student'), (req, res) => {
  const { canvaLink, note } = req.body;
  if (!canvaLink?.trim()) return res.status(400).json({ error: 'กรุณากรอกลิงก์ผลงาน' });

  const sc = db.prepare('SELECT * FROM student_challenges WHERE challenge_id = ? AND student_id = ?').get(req.params.id, req.user.id);
  if (!sc) return res.status(400).json({ error: 'ยังไม่ได้เริ่ม Challenge' });

  const safe = v => (v === undefined || v === '') ? null : v;

  // Upsert link submission
  const existing = db.prepare('SELECT id FROM link_submissions WHERE student_challenge_id = ?').get(sc.id);
  if (existing) {
    db.prepare('UPDATE link_submissions SET canva_link = ?, note = ?, submitted_at = CURRENT_TIMESTAMP WHERE student_challenge_id = ?').run(canvaLink.trim(), safe(note), sc.id);
  } else {
    db.prepare('INSERT INTO link_submissions (student_challenge_id, canva_link, note) VALUES (?, ?, ?)').run(sc.id, canvaLink.trim(), safe(note));
  }

  // อัปเดต canva_link ใน student_challenges
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  const deadline = challenge?.deadline ? new Date(challenge.deadline) : null;
  const isOnTime = deadline ? (new Date() <= deadline ? 1 : 0) : 1;

  db.prepare("UPDATE student_challenges SET status='submitted', submitted_at=CURRENT_TIMESTAMP, canva_link=?, is_on_time=? WHERE id=?").run(canvaLink.trim(), isOnTime, sc.id);

  // บันทึกลิงก์ Canva เป็นของกลุ่มของนักเรียนด้วย
  try {
    const groupMember = db.prepare(`
      SELECT gm.group_id FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      WHERE gm.student_id = ?
    `).get(req.user.id);
    if (groupMember?.group_id) {
      db.prepare(`
        INSERT INTO group_canva_links (group_id, challenge_id, canva_link, set_by)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(group_id, challenge_id) DO UPDATE SET canva_link = excluded.canva_link, set_by = excluded.set_by
      `).run(groupMember.group_id, req.params.id, canvaLink.trim(), req.user.id);
    }
  } catch (err) {
    console.error('Failed to update group_canva_links on submission:', err);
  }

  logActivity(req.user.id, 'SUBMIT_LINK', 'challenge', req.params.id, JSON.stringify({ canvaLink }));
  res.json({ message: 'ส่งงานสำเร็จ!' });
});


// POST /api/challenges/:id/start - Student starts a challenge
router.post('/:id/start', requireRole('student'), (req, res) => {
  const challengeId = req.params.id;
  const challenge = db.prepare(`SELECT * FROM challenges WHERE id = ? AND status = 'active'`).get(challengeId);
  if (!challenge) return res.status(404).json({ error: 'ไม่พบ Challenge' });

  const existing = db.prepare('SELECT * FROM student_challenges WHERE challenge_id = ? AND student_id = ?').get(challengeId, req.user.id);
  if (existing && existing.status !== 'not_started') {
    return res.json({ message: 'กำลังทำ Challenge อยู่แล้ว', studentChallengeId: existing.id });
  }

  const now = new Date().toISOString();
  let scId;

  if (existing) {
    db.prepare("UPDATE student_challenges SET status='in_progress', started_at=? WHERE id=?").run(now, existing.id);
    scId = existing.id;
  } else {
    const enrollment = db.prepare('SELECT class_id FROM class_enrollments WHERE student_id = ?').get(req.user.id);
    const groupRow = db.prepare('SELECT g.id FROM groups g JOIN group_members gm ON gm.group_id = g.id WHERE gm.student_id = ? AND g.class_id = ?').get(req.user.id, enrollment?.class_id);
    scId = db.prepare("INSERT INTO student_challenges (student_id, challenge_id, group_id, status, started_at) VALUES (?, ?, ?, 'in_progress', ?)").run(req.user.id, challengeId, groupRow?.id || null, now).lastInsertRowid;
  }

  // Initialize mission progress
  const missions = db.prepare('SELECT * FROM missions WHERE challenge_id = ? ORDER BY order_num').all(challengeId);
  const existingProgress = db.prepare('SELECT mission_id FROM mission_progress WHERE student_challenge_id = ?').all(scId).map(r => r.mission_id);

  missions.forEach((m, i) => {
    if (!existingProgress.includes(m.id)) {
      db.prepare("INSERT INTO mission_progress (student_challenge_id, mission_id, status) VALUES (?, ?, ?)").run(scId, m.id, i === 0 ? 'in_progress' : 'locked');
    }
  });

  // Initialize checklist completions
  const items = db.prepare('SELECT * FROM checklist_items WHERE challenge_id = ?').all(challengeId);
  const existingChecks = db.prepare('SELECT checklist_item_id FROM checklist_completions WHERE student_challenge_id = ?').all(scId).map(r => r.checklist_item_id);
  items.forEach(item => {
    if (!existingChecks.includes(item.id)) {
      db.prepare("INSERT INTO checklist_completions (student_challenge_id, checklist_item_id, checked) VALUES (?, ?, 0)").run(scId, item.id);
    }
  });

  // Award XP for starting
  awardXP(req.user.id, 5, 'เริ่ม Challenge', challengeId);
  logActivity(req.user.id, 'START_CHALLENGE', 'challenge', challengeId);

  res.json({ message: 'เริ่ม Challenge สำเร็จ', studentChallengeId: scId });
});

// GET /api/challenges/:id/submissions - Teacher view submissions
router.get('/:id/submissions', requireRole('teacher'), (req, res) => {
  const challenge = db.prepare('SELECT id, class_id FROM challenges WHERE id = ?').get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'ไม่พบ Challenge' });

  const submissions = db.prepare(`
    SELECT 
      u.id as student_user_id, u.name as student_name, u.student_id as student_code, u.username,
      sc.id, sc.student_id, sc.challenge_id, sc.group_id,
      COALESCE(sc.status, 'not_started') as status,
      sc.started_at, sc.submitted_at, sc.time_used_seconds, sc.is_on_time,
      sc.canva_link,
      s.file_name, s.submitted_at as sub_file_time, s.submission_status,
      sc2.score, sc2.graded_at,
      g.name as group_name,
      (SELECT COUNT(*) FROM checklist_items ci WHERE ci.challenge_id = ?) as total_checklists,
      (SELECT COUNT(*) FROM checklist_completions cc WHERE cc.student_challenge_id = sc.id AND cc.checked = 1) as completed_checklists,
      (SELECT COUNT(*) FROM missions m WHERE m.challenge_id = ?) as total_missions,
      (SELECT COUNT(*) FROM mission_progress mp WHERE mp.student_challenge_id = sc.id AND mp.status = 'completed') as completed_missions
    FROM users u
    JOIN class_enrollments ce ON ce.student_id = u.id AND ce.class_id = ?
    LEFT JOIN student_challenges sc ON sc.student_id = u.id AND sc.challenge_id = ?
    LEFT JOIN groups g ON g.id = sc.group_id
    LEFT JOIN submissions s ON s.student_challenge_id = sc.id
    LEFT JOIN scores sc2 ON sc2.student_challenge_id = sc.id
    WHERE u.role = 'student'
    ORDER BY u.student_id ASC
  `).all(challenge.id, challenge.id, challenge.class_id, challenge.id);

  res.json({ submissions });
});

export default router;
