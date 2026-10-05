import express from 'express';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getUserXP, getUserLevel } from '../services/gamification.js';

const router = express.Router();
router.use(authenticate);

// GET /api/gamification/my/xp - Student's XP + level
router.get('/my/xp', requireRole('student'), (req, res) => {
  const xp = getUserXP(req.user.id);
  const levelInfo = getUserLevel(xp);
  const xpLog = db.prepare('SELECT * FROM xp_log WHERE student_id = ? ORDER BY earned_at DESC LIMIT 20').all(req.user.id);
  res.json({ xp, ...levelInfo, xpLog });
});

// GET /api/gamification/my/badges - Student's badges
router.get('/my/badges', requireRole('student'), (req, res) => {
  const allBadges = db.prepare('SELECT * FROM badges').all();
  const earnedBadges = db.prepare('SELECT badge_id, earned_at FROM student_badges WHERE student_id = ?').all(req.user.id);
  const earnedIds = earnedBadges.reduce((acc, b) => { acc[b.badge_id] = b.earned_at; return acc; }, {});

  const badges = allBadges.map(b => ({
    ...b,
    earned: !!earnedIds[b.id],
    earned_at: earnedIds[b.id] || null,
  }));

  res.json({ badges });
});

// GET /api/gamification/my/progress - Student full progress
router.get('/my/progress', requireRole('student'), (req, res) => {
  const xp = getUserXP(req.user.id);
  const levelInfo = getUserLevel(xp);

  const challenges = db.prepare(`
    SELECT sc.*, c.title as challenge_title, c.difficulty, c.max_score,
      s.score, sub.submission_status
    FROM student_challenges sc
    JOIN challenges c ON c.id = sc.challenge_id
    LEFT JOIN scores s ON s.student_challenge_id = sc.id
    LEFT JOIN submissions sub ON sub.student_challenge_id = sc.id
    WHERE sc.student_id = ?
    ORDER BY sc.created_at DESC
  `).all(req.user.id);

  const completed = challenges.filter(c => ['submitted', 'graded'].includes(c.status));
  const onTimeCount = challenges.filter(c => c.is_on_time === 1).length;
  const lateCount = challenges.filter(c => c.is_on_time === 0).length;
  const scores = completed.filter(c => c.score).map(c => c.score);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const onTimeRate = completed.length > 0 ? Math.round((onTimeCount / completed.length) * 100) : 0;

  const badges = db.prepare(`
    SELECT b.*, sb.earned_at FROM student_badges sb
    JOIN badges b ON b.id = sb.badge_id WHERE sb.student_id = ?
  `).all(req.user.id);

  const reflections = db.prepare(`
    SELECT r.*, c.title as challenge_title FROM reflections r
    JOIN student_challenges sc ON sc.id = r.student_challenge_id
    JOIN challenges c ON c.id = sc.challenge_id
    WHERE sc.student_id = ?
    ORDER BY r.created_at DESC
  `).all(req.user.id);

  const xpByDate = db.prepare(`
    SELECT DATE(earned_at) as date, SUM(amount) as xp
    FROM xp_log WHERE student_id = ?
    GROUP BY DATE(earned_at) ORDER BY date ASC
  `).all(req.user.id);

  res.json({
    xp, ...levelInfo,
    stats: { totalChallenges: challenges.length, completed: completed.length, onTimeCount, lateCount, avgScore, onTimeRate },
    challenges, badges, reflections, xpByDate,
  });
});

// GET /api/gamification/leaderboard
router.get('/leaderboard', (req, res) => {
  const classRow = db.prepare('SELECT id FROM classes WHERE teacher_id = ?').get(req.user.id) ||
    (() => {
      const enroll = db.prepare('SELECT class_id FROM class_enrollments WHERE student_id = ?').get(req.user.id);
      return enroll ? { id: enroll.class_id } : null;
    })();

  if (!classRow) return res.json({ leaderboard: [] });

  const students = db.prepare(`
    SELECT u.id, u.name FROM users u
    JOIN class_enrollments ce ON ce.student_id = u.id
    WHERE ce.class_id = ? AND u.role = 'student'
  `).all(classRow.id);

  const leaderboard = students.map(s => {
    const xp = getUserXP(s.id);
    const level = getUserLevel(xp);
    const badges = db.prepare('SELECT COUNT(*) as cnt FROM student_badges WHERE student_id = ?').get(s.id)?.cnt || 0;
    return { ...s, xp, level: level.level, levelName: level.nameTh, badgeCount: badges };
  }).sort((a, b) => b.xp - a.xp).map((s, i) => ({ ...s, rank: i + 1 }));

  res.json({ leaderboard });
});

export default router;
