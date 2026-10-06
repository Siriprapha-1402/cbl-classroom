import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getUserXP, getUserLevel } from '../services/gamification.js';

const router = express.Router();
router.use(authenticate, requireRole('teacher'));

// ─── Reset Helper Function ──────────────────────────────────────────────────
function performStudentReset(studentId, target) {
  const student = db.prepare("SELECT id, username FROM users WHERE id = ? AND role = 'student'").get(studentId);
  if (!student) return false;

  if (target === 'xp' || target === 'all' || target === 'all_progress') {
    db.prepare('DELETE FROM xp_log WHERE student_id = ?').run(studentId);
  }

  if (target === 'badges' || target === 'all' || target === 'all_progress') {
    db.prepare('DELETE FROM student_badges WHERE student_id = ?').run(studentId);
  }

  if (target === 'group' || target === 'all') {
    db.prepare('DELETE FROM group_members WHERE student_id = ?').run(studentId);
    db.prepare('UPDATE groups SET leader_id = NULL WHERE leader_id = ?').run(studentId);
  }

  if (target === 'submissions' || target === 'all' || target === 'all_progress') {
    db.prepare(`
      DELETE FROM submissions 
      WHERE student_challenge_id IN (SELECT id FROM student_challenges WHERE student_id = ?)
    `).run(studentId);

    db.prepare(`
      DELETE FROM scores 
      WHERE student_challenge_id IN (SELECT id FROM student_challenges WHERE student_id = ?)
    `).run(studentId);

    db.prepare(`
      DELETE FROM feedback 
      WHERE student_challenge_id IN (SELECT id FROM student_challenges WHERE student_id = ?)
    `).run(studentId);

    db.prepare(`
      DELETE FROM reflections 
      WHERE student_challenge_id IN (SELECT id FROM student_challenges WHERE student_id = ?)
    `).run(studentId);

    db.prepare(`
      DELETE FROM mission_progress 
      WHERE student_challenge_id IN (SELECT id FROM student_challenges WHERE student_id = ?)
    `).run(studentId);

    db.prepare(`
      DELETE FROM checklist_completions 
      WHERE student_challenge_id IN (SELECT id FROM student_challenges WHERE student_id = ?)
    `).run(studentId);

    db.prepare(`
      DELETE FROM link_submissions 
      WHERE student_challenge_id IN (SELECT id FROM student_challenges WHERE student_id = ?)
    `).run(studentId);

    db.prepare('DELETE FROM challenge_activity WHERE student_id = ?').run(studentId);
    db.prepare('DELETE FROM student_challenges WHERE student_id = ?').run(studentId);
  }

  if (target === 'assessments' || target === 'all' || target === 'all_progress') {
    db.prepare('DELETE FROM behavior_assessments WHERE student_id = ?').run(studentId);
    db.prepare('DELETE FROM skill_assessments WHERE student_id = ?').run(studentId);
  }

  if (target === 'password' || target === 'all') {
    const defaultHash = bcrypt.hashSync(student.username, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(defaultHash, studentId);
  }

  return true;
}

// GET /api/students - All students in teacher's class
router.get('/', (req, res) => {
  const classRow = db.prepare('SELECT id FROM classes WHERE teacher_id = ?').get(req.user.id);
  if (!classRow) return res.json({ students: [] });

  const students = db.prepare(`
    SELECT u.id, u.name, u.username, u.student_id as student_code, u.class_name,
      (SELECT COUNT(*) FROM student_challenges sc WHERE sc.student_id = u.id AND sc.status IN ('submitted','graded')) as completed_count,
      (SELECT COUNT(*) FROM student_challenges sc WHERE sc.student_id = u.id AND sc.is_on_time = 1) as on_time_count,
      (SELECT COUNT(*) FROM student_challenges sc WHERE sc.student_id = u.id AND sc.submitted_at IS NOT NULL) as submitted_count,
      (SELECT MAX(al.created_at) FROM activity_logs al WHERE al.user_id = u.id) as last_active,
      g.name as group_name
    FROM users u
    JOIN class_enrollments ce ON ce.student_id = u.id
    LEFT JOIN group_members gm ON gm.student_id = u.id
    LEFT JOIN groups g ON g.id = gm.group_id AND g.class_id = ?
    WHERE ce.class_id = ? AND u.role = 'student'
    ORDER BY u.username ASC
  `).all(classRow.id, classRow.id);

  const studentsWithXP = students.map((s, idx) => {
    const xp = getUserXP(s.id);
    const level = getUserLevel(xp);
    const onTimeRate = s.submitted_count > 0 ? Math.round((s.on_time_count / s.submitted_count) * 100) : 0;
    return { ...s, orderNum: idx + 1, xp, level: level.level, levelName: level.nameTh, onTimeRate };
  });

  res.json({ students: studentsWithXP });
});

// GET /api/students/:id - Student detail
router.get('/:id', (req, res) => {
  const student = db.prepare("SELECT id, name, username, student_id as student_code, class_name FROM users WHERE id = ? AND role = 'student'").get(req.params.id);
  if (!student) return res.status(404).json({ error: 'ไม่พบนักเรียน' });

  const xp = getUserXP(student.id);
  const level = getUserLevel(xp);

  const challenges = db.prepare(`
    SELECT sc.*, c.title as challenge_title, c.max_score, c.difficulty,
      s.score, s.graded_at,
      sub.file_name, sub.submitted_at as file_submitted_at, sub.submission_status
    FROM student_challenges sc
    JOIN challenges c ON c.id = sc.challenge_id
    LEFT JOIN scores s ON s.student_challenge_id = sc.id
    LEFT JOIN submissions sub ON sub.student_challenge_id = sc.id
    WHERE sc.student_id = ?
    ORDER BY sc.created_at DESC
  `).all(student.id);

  const badges = db.prepare(`
    SELECT b.*, sb.earned_at FROM student_badges sb
    JOIN badges b ON b.id = sb.badge_id
    WHERE sb.student_id = ?
  `).all(student.id);

  const xpLog = db.prepare('SELECT * FROM xp_log WHERE student_id = ? ORDER BY earned_at DESC LIMIT 20').all(student.id);

  const activityLog = db.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 30').all(student.id);

  const stats = {
    totalChallenges: challenges.length,
    completed: challenges.filter(c => ['submitted', 'graded'].includes(c.status)).length,
    onTime: challenges.filter(c => c.is_on_time === 1).length,
    late: challenges.filter(c => c.is_on_time === 0).length,
    avgScore: challenges.filter(c => c.score).reduce((a, b) => a + (b.score || 0), 0) / (challenges.filter(c => c.score).length || 1),
  };

  res.json({ student: { ...student, xp, ...level }, challenges, badges, xpLog, activityLog, stats });
});

// GET /api/students/:id/activity
router.get('/:id/activity', (req, res) => {
  const logs = db.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.params.id);
  res.json({ logs });
});

// ─── RESET ENDPOINTS ─────────────────────────────────────────────────────────

// POST /api/students/:id/reset - Reset specific data for a single student
router.post('/:id/reset', (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const { target = 'all' } = req.body;

    db.exec('BEGIN TRANSACTION');
    try {
      const success = performStudentReset(studentId, target);
      if (!success) {
        db.exec('ROLLBACK');
        return res.status(404).json({ error: 'ไม่พบนักเรียน' });
      }
      db.exec('COMMIT');
      res.json({ success: true, message: `ล้างค่า ${target} ของนักเรียนเรียบร้อยแล้ว` });
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error resetting student data:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/students/reset-batch - Reset specific data for selected students
router.post('/reset-batch', (req, res) => {
  try {
    const { studentIds, target = 'all' } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'กรุณาระบุ studentIds เป็น array' });
    }

    db.exec('BEGIN TRANSACTION');
    try {
      let resetCount = 0;
      for (const sid of studentIds) {
        const ok = performStudentReset(Number(sid), target);
        if (ok) resetCount++;
      }
      db.exec('COMMIT');
      res.json({ success: true, resetCount, message: `ล้างค่า ${target} ให้ ${resetCount} คนเรียบร้อยแล้ว` });
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error batch resetting student data:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/students/reset-class - Reset specific data for all students in class
router.post('/reset-class', (req, res) => {
  try {
    const classRow = db.prepare('SELECT id FROM classes WHERE teacher_id = ?').get(req.user.id);
    if (!classRow) return res.status(404).json({ error: 'ไม่พบคลาสเรียน' });

    const { target = 'all' } = req.body;
    const students = db.prepare(`
      SELECT u.id FROM users u
      JOIN class_enrollments ce ON ce.student_id = u.id
      WHERE ce.class_id = ? AND u.role = 'student'
    `).all(classRow.id);

    db.exec('BEGIN TRANSACTION');
    try {
      let count = 0;
      for (const s of students) {
        performStudentReset(s.id, target);
        count++;
      }
      db.exec('COMMIT');
      res.json({ success: true, count, message: `ล้างค่า ${target} ของนักเรียนทั้งห้อง (${count} คน) เรียบร้อยแล้ว` });
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error resetting class data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
