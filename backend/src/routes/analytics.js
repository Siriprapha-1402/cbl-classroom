import express from 'express';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getUserXP, getUserLevel } from '../services/gamification.js';

const router = express.Router();
router.use(authenticate, requireRole('teacher'));

// GET /api/analytics/class - Comprehensive class analytics
router.get('/class', (req, res) => {
  const classRow = db.prepare('SELECT * FROM classes WHERE teacher_id = ?').get(req.user.id);
  if (!classRow) return res.json({});

  const students = db.prepare(`SELECT u.id FROM users u JOIN class_enrollments ce ON ce.student_id = u.id WHERE ce.class_id = ?`).all(classRow.id);
  const totalStudents = students.length;

  const challenges = db.prepare('SELECT * FROM challenges WHERE class_id = ?').all(classRow.id);

  // Submission overview
  let onTime = 0, late = 0, submitted = 0, inProgress = 0, notStarted = 0;
  challenges.forEach(c => {
    const rows = db.prepare('SELECT status, is_on_time FROM student_challenges WHERE challenge_id = ?').all(c.id);
    rows.forEach(r => {
      if (r.status === 'graded' || r.status === 'submitted') {
        submitted++;
        if (r.is_on_time === 1) onTime++;
        else if (r.is_on_time === 0) late++;
      } else if (r.status === 'in_progress') inProgress++;
      else notStarted++;
    });
  });

  // Per-challenge stats
  const challengeStats = challenges.map(c => {
    const rows = db.prepare('SELECT status, is_on_time FROM student_challenges WHERE challenge_id = ?').all(c.id);
    const totalEnrolled = totalStudents;
    const submittedCount = rows.filter(r => ['submitted', 'graded'].includes(r.status)).length;
    const onTimeCount = rows.filter(r => r.is_on_time === 1).length;
    const lateCount = rows.filter(r => r.is_on_time === 0).length;
    const scores = db.prepare(`
      SELECT s.score FROM scores s
      JOIN student_challenges sc ON sc.id = s.student_challenge_id
      WHERE sc.challenge_id = ?
    `).all(c.id).map(r => r.score);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      id: c.id, title: c.title, difficulty: c.difficulty,
      totalEnrolled, submittedCount, onTimeCount, lateCount, avgScore,
      notStarted: totalEnrolled - rows.length,
    };
  });

  // Performance stats
  const allScores = db.prepare(`
    SELECT s.score FROM scores s
    JOIN student_challenges sc ON sc.id = s.student_challenge_id
    JOIN challenges c ON c.id = sc.challenge_id
    WHERE c.teacher_id = ?
  `).all(req.user.id).map(r => r.score);
  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
  const maxScore = allScores.length > 0 ? Math.max(...allScores) : 0;
  const minScore = allScores.length > 0 ? Math.min(...allScores) : 0;

  // Reflection stats
  const reflections = db.prepare(`
    SELECT r.self_score FROM reflections r
    JOIN student_challenges sc ON sc.id = r.student_challenge_id
    JOIN challenges c ON c.id = sc.challenge_id
    WHERE c.teacher_id = ?
  `).all(req.user.id);
  const avgSelfScore = reflections.length > 0 ? (reflections.reduce((a, b) => a + b.self_score, 0) / reflections.length).toFixed(2) : 0;

  // Daily submission counts (last 30 days)
  const dailySubmissions = db.prepare(`
    SELECT DATE(sc.submitted_at) as date, COUNT(*) as count,
      SUM(CASE WHEN sc.is_on_time = 1 THEN 1 ELSE 0 END) as on_time_count
    FROM student_challenges sc
    JOIN challenges c ON c.id = sc.challenge_id
    WHERE c.teacher_id = ? AND sc.submitted_at IS NOT NULL
      AND sc.submitted_at >= datetime('now', '-30 days')
    GROUP BY DATE(sc.submitted_at)
    ORDER BY date
  `).all(req.user.id);

  // Student engagement
  const engagementStats = students.map(s => {
    const loginCount = db.prepare("SELECT COUNT(*) as cnt FROM activity_logs WHERE user_id = ? AND action = 'LOGIN'").get(s.id)?.cnt || 0;
    const challengeStarted = db.prepare("SELECT COUNT(*) as cnt FROM student_challenges WHERE student_id = ? AND status != 'not_started'").get(s.id)?.cnt || 0;
    const missionsDone = db.prepare("SELECT COUNT(*) as cnt FROM mission_progress WHERE status = 'completed' AND student_challenge_id IN (SELECT id FROM student_challenges WHERE student_id = ?)").get(s.id)?.cnt || 0;
    return { studentId: s.id, loginCount, challengeStarted, missionsDone };
  });

  res.json({
    totalStudents,
    summary: { totalStudents, submitted, onTime, late, inProgress, notStarted },
    challengeStats,
    performance: { avgScore, maxScore, minScore },
    reflectionStats: { avgSelfScore, totalReflections: reflections.length },
    dailySubmissions,
    engagementStats,
  });
});

// GET /api/analytics/research - Research data
router.get('/research', (req, res) => {
  const classRow = db.prepare('SELECT * FROM classes WHERE teacher_id = ?').get(req.user.id);
  if (!classRow) return res.json({});

  const challenges = db.prepare('SELECT * FROM challenges WHERE class_id = ? ORDER BY created_at ASC').all(classRow.id);

  // Split into first half (before) and second half (after)
  const half = Math.ceil(challenges.length / 2);
  const beforeChallenges = challenges.slice(0, half);
  const afterChallenges = challenges.slice(half);

  function getStats(cids) {
    if (cids.length === 0) return { total: 0, submitted: 0, onTime: 0, late: 0, notSubmitted: 0, avgScore: 0 };
    const placeholders = cids.map(() => '?').join(',');
    const rows = db.prepare(`SELECT status, is_on_time FROM student_challenges WHERE challenge_id IN (${placeholders})`).all(...cids.map(c => c.id));
    const scores = db.prepare(`
      SELECT s.score FROM scores s
      JOIN student_challenges sc ON sc.id = s.student_challenge_id
      WHERE sc.challenge_id IN (${placeholders})
    `).all(...cids.map(c => c.id)).map(r => r.score);

    const submitted = rows.filter(r => ['submitted', 'graded'].includes(r.status)).length;
    const onTime = rows.filter(r => r.is_on_time === 1).length;
    const late = rows.filter(r => r.is_on_time === 0).length;
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return { total: rows.length, submitted, onTime, late, notSubmitted: rows.length - submitted, avgScore };
  }

  const before = getStats(beforeChallenges);
  const after = getStats(afterChallenges);

  // Reflection data
  const reflections = db.prepare(`
    SELECT r.*, u.name as student_name, c.title as challenge_title, sc.challenge_id
    FROM reflections r
    JOIN student_challenges sc ON sc.id = r.student_challenge_id
    JOIN users u ON u.id = sc.student_id
    JOIN challenges c ON c.id = sc.challenge_id
    WHERE c.class_id = ?
    ORDER BY r.created_at DESC
  `).all(classRow.id);

  const avgSelfScore = reflections.length > 0
    ? (reflections.reduce((a, r) => a + r.self_score, 0) / reflections.length).toFixed(2) : 0;

  res.json({
    before: { challenges: beforeChallenges.map(c => c.title), stats: before },
    after: { challenges: afterChallenges.map(c => c.title), stats: after },
    reflections: { data: reflections, avgSelfScore, total: reflections.length },
    note: 'XP และ Badge เป็นข้อมูลประกอบ ไม่ใช่ตัวแทนของความตั้งใจเรียนโดยตรง',
  });
});

export default router;
