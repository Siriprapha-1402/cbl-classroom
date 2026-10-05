import express from 'express';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, requireRole('teacher'));

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(headers, rows) {
  const head = headers.join(',');
  const body = rows.map(row => headers.map(h => escapeCSV(row[h])).join(','));
  return [head, ...body].join('\n');
}

// GET /api/export/submissions
router.get('/submissions', (req, res) => {
  const data = db.prepare(`
    SELECT
      u.name as studentName, u.student_id as studentId, u.class_name as className,
      c.title as challengeTitle, c.difficulty,
      sc.status, sc.started_at as startedAt, sc.submitted_at as submittedAt,
      sc.time_used_seconds as timeUsedSeconds, sc.is_on_time as isOnTime,
      sub.submission_status as submissionStatus,
      s.score, s.max_score as maxScore, s.graded_at as gradedAt
    FROM student_challenges sc
    JOIN users u ON u.id = sc.student_id
    JOIN challenges c ON c.id = sc.challenge_id
    LEFT JOIN submissions sub ON sub.student_challenge_id = sc.id
    LEFT JOIN scores s ON s.student_challenge_id = sc.id
    WHERE c.teacher_id = ?
    ORDER BY u.username ASC, sc.created_at
  `).all(req.user.id);

  const headers = ['studentName', 'studentId', 'className', 'challengeTitle', 'difficulty', 'status', 'startedAt', 'submittedAt', 'timeUsedSeconds', 'isOnTime', 'submissionStatus', 'score', 'maxScore', 'gradedAt'];
  const csv = toCSV(headers, data);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="cbl_submissions.csv"');
  res.send('\uFEFF' + csv); // BOM for Thai UTF-8 in Excel
});

// GET /api/export/progress
router.get('/progress', (req, res) => {
  const classRow = db.prepare('SELECT id FROM classes WHERE teacher_id = ?').get(req.user.id);
  if (!classRow) return res.json([]);

  const data = db.prepare(`
    SELECT
      u.name as studentName, u.student_id as studentId,
      COUNT(sc.id) as totalChallenges,
      SUM(CASE WHEN sc.status IN ('submitted','graded') THEN 1 ELSE 0 END) as completedCount,
      SUM(CASE WHEN sc.is_on_time = 1 THEN 1 ELSE 0 END) as onTimeCount,
      SUM(CASE WHEN sc.is_on_time = 0 THEN 1 ELSE 0 END) as lateCount,
      COALESCE(AVG(s.score), 0) as avgScore,
      COALESCE(SUM(x.amount), 0) as totalXP
    FROM users u
    JOIN class_enrollments ce ON ce.student_id = u.id
    LEFT JOIN student_challenges sc ON sc.student_id = u.id
    LEFT JOIN scores s ON s.student_challenge_id = sc.id
    LEFT JOIN (SELECT student_id, SUM(amount) as amount FROM xp_log GROUP BY student_id) x ON x.student_id = u.id
    WHERE ce.class_id = ? AND u.role = 'student'
    GROUP BY u.id
    ORDER BY u.username ASC
  `).all(classRow.id);

  const headers = ['studentName', 'studentId', 'totalChallenges', 'completedCount', 'onTimeCount', 'lateCount', 'avgScore', 'totalXP'];
  const csv = toCSV(headers, data);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="cbl_progress.csv"');
  res.send('\uFEFF' + csv);
});

export default router;
