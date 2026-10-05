import express from 'express';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { awardXP, checkAndAwardBadges, logActivity } from '../services/gamification.js';

const router = express.Router();
router.use(authenticate);

// POST /api/missions/:id/complete - Student attempted completion
router.post('/:id/complete', requireRole('student'), (req, res) => {
  return res.status(403).json({ error: 'ขั้นตอน (Mission) นี้ครูผู้สอนจะเป็นผู้ตรวจสอบและเช็คความถูกต้องให้' });
});

// POST /api/missions/teacher/toggle - Teacher toggles mission status for student or group
router.post('/teacher/toggle', requireRole('teacher'), (req, res) => {
  const { missionId, studentChallengeId, applyToGroup = true } = req.body;
  if (!missionId || !studentChallengeId) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
  }

  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(missionId);
  if (!mission) return res.status(404).json({ error: 'ไม่พบขั้นตอน (Mission)' });

  const targetSc = db.prepare('SELECT * FROM student_challenges WHERE id = ?').get(studentChallengeId);
  if (!targetSc) return res.status(404).json({ error: 'ไม่พบข้อมูลกิจกรรมของนักเรียน' });

  // If applyToGroup and group_id exists, find all student_challenges for that group and challenge
  let scList = [targetSc];
  if (applyToGroup && targetSc.group_id) {
    const groupScs = db.prepare('SELECT * FROM student_challenges WHERE group_id = ? AND challenge_id = ?').all(targetSc.group_id, targetSc.challenge_id);
    if (groupScs.length > 0) scList = groupScs;
  }

  const now = new Date().toISOString();
  let newStatus = 'completed';

  for (const sc of scList) {
    let progress = db.prepare('SELECT * FROM mission_progress WHERE student_challenge_id = ? AND mission_id = ?').get(sc.id, missionId);
    if (!progress) {
      db.prepare('INSERT INTO mission_progress (student_challenge_id, mission_id, status, completed_at) VALUES (?, ?, ?, ?)').run(sc.id, missionId, 'completed', now);
      progress = { status: 'completed' };
    } else {
      newStatus = progress.status === 'completed' ? 'in_progress' : 'completed';
      db.prepare("UPDATE mission_progress SET status=?, completed_at=? WHERE id=?").run(
        newStatus,
        newStatus === 'completed' ? now : null,
        progress.id
      );
    }

    if (newStatus === 'completed') {
      awardXP(sc.student_id, mission.xp_reward, `ครูตรวจผ่านขั้นตอน: ${mission.title}`, mission.challenge_id);
      checkAndAwardBadges(sc.student_id);
    }
  }

  res.json({ message: `อัปเดตขั้นตอนสำเร็จ (${newStatus})`, status: newStatus, count: scList.length });
});

// POST /api/missions/teacher/batch - Teacher batch checks all missions
router.post('/teacher/batch', requireRole('teacher'), (req, res) => {
  const { studentChallengeId, completeAll = true, applyToGroup = true } = req.body;
  const targetSc = db.prepare('SELECT * FROM student_challenges WHERE id = ?').get(studentChallengeId);
  if (!targetSc) return res.status(404).json({ error: 'ไม่พบข้อมูลกิจกรรมของนักเรียน' });

  let scList = [targetSc];
  if (applyToGroup && targetSc.group_id) {
    const groupScs = db.prepare('SELECT * FROM student_challenges WHERE group_id = ? AND challenge_id = ?').all(targetSc.group_id, targetSc.challenge_id);
    if (groupScs.length > 0) scList = groupScs;
  }

  const missions = db.prepare('SELECT * FROM missions WHERE challenge_id = ? ORDER BY order_num').all(targetSc.challenge_id);
  const now = new Date().toISOString();
  const st = completeAll ? 'completed' : 'in_progress';

  for (const sc of scList) {
    for (const m of missions) {
      const p = db.prepare('SELECT id FROM mission_progress WHERE student_challenge_id = ? AND mission_id = ?').get(sc.id, m.id);
      if (p) {
        db.prepare('UPDATE mission_progress SET status=?, completed_at=? WHERE id=?').run(st, completeAll ? now : null, p.id);
      } else {
        db.prepare('INSERT INTO mission_progress (student_challenge_id, mission_id, status, completed_at) VALUES (?, ?, ?, ?)').run(sc.id, m.id, st, completeAll ? now : null);
      }
      if (completeAll) {
        awardXP(sc.student_id, m.xp_reward, `ครูตรวจผ่านขั้นตอน: ${m.title}`, m.challenge_id);
      }
    }
    checkAndAwardBadges(sc.student_id);
  }

  res.json({ message: 'อัปเดตขั้นตอนทั้งหมดสำเร็จ', status: st, count: scList.length });
});

export default router;
