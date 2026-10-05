import express from 'express';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { awardXP, checkAndAwardBadges, logActivity } from '../services/gamification.js';

const router = express.Router();
router.use(authenticate);

// POST /api/challenges/:challengeId/submit - Student submits work
router.post('/challenges/:challengeId/submit', requireRole('student'), upload.array('files', 5), (req, res) => {
  const { challengeId } = req.params;

  const sc = db.prepare('SELECT * FROM student_challenges WHERE challenge_id = ? AND student_id = ?').get(challengeId, req.user.id);
  if (!sc) return res.status(400).json({ error: 'ยังไม่ได้เริ่ม Challenge' });

  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'กรุณาแนบไฟล์ผลงาน' });

  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challengeId);
  const now = new Date();
  const deadline = challenge.deadline ? new Date(challenge.deadline) : null;

  let isOnTime = 1;
  let submissionStatus = 'on_time';
  if (deadline) {
    if (now > deadline) { isOnTime = 0; submissionStatus = 'late'; }
    else if ((deadline - now) < 5 * 60 * 1000) { submissionStatus = 'near_deadline'; }
  }

  const timeUsed = sc.started_at ? Math.floor((now - new Date(sc.started_at)) / 1000) : null;

  db.prepare("UPDATE student_challenges SET status='submitted', submitted_at=?, time_used_seconds=?, is_on_time=? WHERE id=?")
    .run(now.toISOString(), timeUsed, isOnTime, sc.id);

  const insertSub = db.prepare('INSERT INTO submissions (student_challenge_id, file_name, file_path, file_type, submitted_at, submission_status) VALUES (?, ?, ?, ?, ?, ?)');
  req.files.forEach(f => insertSub.run(sc.id, f.originalname, f.filename, f.mimetype, now.toISOString(), submissionStatus));

  // Award XP
  awardXP(req.user.id, 20, 'ส่งผลงาน', challengeId);
  if (isOnTime) {
    awardXP(req.user.id, 30, 'ส่งตรงเวลา', challengeId);
    // Early bird bonus: >5 min before deadline
    if (deadline && (deadline - now) > 5 * 60 * 1000) {
      awardXP(req.user.id, 40, 'ส่งก่อน Deadline', challengeId);
    }
  }

  // Notify teacher
  const teacherClass = db.prepare('SELECT teacher_id FROM classes WHERE id = ?').get(challenge.class_id);
  if (teacherClass) {
    db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
      teacherClass.teacher_id, 'มีผลงานรอตรวจ 📋',
      `${req.user.name} ส่งงาน "${challenge.title}" ${submissionStatus === 'late' ? '⚠️ ล่าช้า' : '✅ ตรงเวลา'}`, 'info'
    );
  }

  checkAndAwardBadges(req.user.id);
  logActivity(req.user.id, 'SUBMIT_WORK', 'challenge', challengeId, { submissionStatus });

  res.json({ message: 'ส่งผลงานสำเร็จ!', submissionStatus, xpEarned: isOnTime ? 90 : 20 });
});

// POST /api/checklists/:itemId/toggle - Student attempt toggle
router.post('/checklists/:itemId/toggle', requireRole('student'), (req, res) => {
  return res.status(403).json({ error: 'รายการ Checklist นี้ครูผู้สอนจะเป็นผู้ตรวจสอบและเช็คความถูกต้องให้' });
});

// POST /api/checklists/teacher/toggle - Teacher checks/unchecks a checklist item
router.post('/checklists/teacher/toggle', requireRole('teacher'), (req, res) => {
  const { itemId, studentChallengeId, applyToGroup = true } = req.body;
  if (!itemId || !studentChallengeId) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
  }

  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(itemId);
  if (!item) return res.status(404).json({ error: 'ไม่พบรายการ Checklist' });

  const targetSc = db.prepare('SELECT * FROM student_challenges WHERE id = ?').get(studentChallengeId);
  if (!targetSc) return res.status(404).json({ error: 'ไม่พบข้อมูลกิจกรรมของนักเรียน' });

  let scList = [targetSc];
  if (applyToGroup && targetSc.group_id) {
    const groupScs = db.prepare('SELECT * FROM student_challenges WHERE group_id = ? AND challenge_id = ?').all(targetSc.group_id, targetSc.challenge_id);
    if (groupScs.length > 0) scList = groupScs;
  }

  const now = new Date().toISOString();
  let newChecked = 1;

  for (const sc of scList) {
    const completion = db.prepare('SELECT * FROM checklist_completions WHERE student_challenge_id = ? AND checklist_item_id = ?').get(sc.id, item.id);
    if (completion) {
      newChecked = completion.checked ? 0 : 1;
      db.prepare('UPDATE checklist_completions SET checked=?, checked_at=? WHERE id=?').run(
        newChecked,
        newChecked ? now : null,
        completion.id
      );
    } else {
      db.prepare('INSERT INTO checklist_completions (student_challenge_id, checklist_item_id, checked, checked_at) VALUES (?, ?, 1, ?)').run(
        sc.id, item.id, now
      );
      newChecked = 1;
    }
  }

  res.json({ message: 'อัปเดต Checklist สำเร็จ', checked: newChecked === 1, count: scList.length });
});

// POST /api/checklists/teacher/batch - Teacher batch check/uncheck all checklist items
router.post('/checklists/teacher/batch', requireRole('teacher'), (req, res) => {
  const { studentChallengeId, checkAll = true, applyToGroup = true } = req.body;
  const targetSc = db.prepare('SELECT * FROM student_challenges WHERE id = ?').get(studentChallengeId);
  if (!targetSc) return res.status(404).json({ error: 'ไม่พบข้อมูลกิจกรรมของนักเรียน' });

  let scList = [targetSc];
  if (applyToGroup && targetSc.group_id) {
    const groupScs = db.prepare('SELECT * FROM student_challenges WHERE group_id = ? AND challenge_id = ?').all(targetSc.group_id, targetSc.challenge_id);
    if (groupScs.length > 0) scList = groupScs;
  }

  const items = db.prepare('SELECT id FROM checklist_items WHERE challenge_id = ? ORDER BY order_num').all(targetSc.challenge_id);
  const now = new Date().toISOString();
  const val = checkAll ? 1 : 0;

  for (const sc of scList) {
    for (const item of items) {
      const completion = db.prepare('SELECT id FROM checklist_completions WHERE student_challenge_id = ? AND checklist_item_id = ?').get(sc.id, item.id);
      if (completion) {
        db.prepare('UPDATE checklist_completions SET checked=?, checked_at=? WHERE id=?').run(val, val ? now : null, completion.id);
      } else {
        db.prepare('INSERT INTO checklist_completions (student_challenge_id, checklist_item_id, checked, checked_at) VALUES (?, ?, ?, ?)').run(sc.id, item.id, val, val ? now : null);
      }
    }
  }

  res.json({ message: 'อัปเดต Checklist ทั้งหมดสำเร็จ', checked: checkAll, count: scList.length });
});

// GET /api/submissions/:studentChallengeId - Get submission details
router.get('/submissions/:studentChallengeId', (req, res) => {
  const sc = db.prepare('SELECT * FROM student_challenges WHERE id = ?').get(req.params.studentChallengeId);
  if (!sc) return res.status(404).json({ error: 'ไม่พบข้อมูล' });

  if (req.user.role === 'student' && sc.student_id !== req.user.id) return res.status(403).json({ error: 'ไม่มีสิทธิ์' });

  const files = db.prepare('SELECT * FROM submissions WHERE student_challenge_id = ?').all(sc.id);
  const score = db.prepare('SELECT * FROM scores WHERE student_challenge_id = ?').get(sc.id);
  const feedback = db.prepare('SELECT * FROM feedback WHERE student_challenge_id = ?').get(sc.id);
  const reflection = db.prepare('SELECT * FROM reflections WHERE student_challenge_id = ?').get(sc.id);

  res.json({ studentChallenge: sc, files, score, feedback, reflection });
});

export default router;
