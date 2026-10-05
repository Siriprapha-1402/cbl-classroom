import express from 'express';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { awardXP, logActivity } from '../services/gamification.js';

const router = express.Router();
router.use(authenticate);

// POST /api/reflections/challenges/:challengeId - Submit reflection
router.post('/challenges/:challengeId', requireRole('student'), (req, res) => {
  const { q1, q2, q3, q4, self_score } = req.body;
  if (!q1 || !self_score) return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });

  const sc = db.prepare('SELECT * FROM student_challenges WHERE challenge_id = ? AND student_id = ?').get(req.params.challengeId, req.user.id);
  if (!sc) return res.status(400).json({ error: 'ไม่พบการทำ Challenge' });

  const existing = db.prepare('SELECT id FROM reflections WHERE student_challenge_id = ?').get(sc.id);
  if (existing) {
    db.prepare('UPDATE reflections SET q1=?, q2=?, q3=?, q4=?, self_score=? WHERE student_challenge_id=?').run(q1, q2, q3, q4, self_score, sc.id);
  } else {
    db.prepare('INSERT INTO reflections (student_challenge_id, q1, q2, q3, q4, self_score) VALUES (?, ?, ?, ?, ?, ?)').run(sc.id, q1, q2, q3, q4, self_score);
    awardXP(req.user.id, 10, 'ทำ Reflection', req.params.challengeId);
  }

  logActivity(req.user.id, 'COMPLETE_REFLECTION', 'challenge', req.params.challengeId);
  res.json({ message: 'บันทึก Reflection สำเร็จ +10 XP' });
});

// GET /api/reflections/challenges/:challengeId - Get student reflection
router.get('/challenges/:challengeId', requireRole('student'), (req, res) => {
  const sc = db.prepare('SELECT * FROM student_challenges WHERE challenge_id = ? AND student_id = ?').get(req.params.challengeId, req.user.id);
  if (!sc) return res.json({ reflection: null });
  const reflection = db.prepare('SELECT * FROM reflections WHERE student_challenge_id = ?').get(sc.id);
  res.json({ reflection });
});

// GET /api/reflections/all - Teacher gets all reflections
router.get('/all', requireRole('teacher'), (req, res) => {
  const reflections = db.prepare(`
    SELECT r.*, u.name as student_name, c.title as challenge_title
    FROM reflections r
    JOIN student_challenges sc ON sc.id = r.student_challenge_id
    JOIN users u ON u.id = sc.student_id
    JOIN challenges c ON c.id = sc.challenge_id
    WHERE c.teacher_id = ?
    ORDER BY r.created_at DESC
  `).all(req.user.id);
  res.json({ reflections });
});

export default router;
