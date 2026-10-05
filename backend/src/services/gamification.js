import db from '../db/db.js';

const LEVELS = [
  { level: 1, name: 'Beginner', nameTh: 'ผู้เริ่มต้น', minXP: 0 },
  { level: 2, name: 'Explorer', nameTh: 'นักสำรวจ', minXP: 200 },
  { level: 3, name: 'Creator', nameTh: 'นักสร้างสรรค์', minXP: 500 },
  { level: 4, name: 'Problem Solver', nameTh: 'นักแก้ปัญหา', minXP: 1000 },
  { level: 5, name: 'Challenge Master', nameTh: 'ผู้เชี่ยวชาญ', minXP: 1800 },
];

export function getUserXP(userId) {
  const row = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM xp_log WHERE student_id = ?').get(userId);
  return row.total;
}

export function getUserLevel(xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXP) current = lvl;
  }
  const nextIdx = LEVELS.findIndex(l => l.level === current.level + 1);
  const next = nextIdx >= 0 ? LEVELS[nextIdx] : null;
  const progress = next
    ? Math.min(((xp - current.minXP) / (next.minXP - current.minXP)) * 100, 100)
    : 100;
  return {
    level: current.level,
    name: current.name,
    nameTh: current.nameTh,
    currentXP: xp,
    nextLevelXP: next?.minXP || null,
    progress: Math.round(progress),
  };
}

export function awardXP(userId, amount, reason, challengeId = null) {
  db.prepare('INSERT INTO xp_log (student_id, amount, reason, challenge_id) VALUES (?, ?, ?, ?)').run(userId, amount, reason, challengeId);
}

export function checkAndAwardBadges(userId) {
  const existingBadges = db.prepare('SELECT badge_id FROM student_badges WHERE student_id = ?').all(userId).map(r => r.badge_id);
  const badges = db.prepare('SELECT * FROM badges').all();

  for (const badge of badges) {
    if (existingBadges.includes(badge.id)) continue;

    let earned = false;

    switch (badge.criteria_type) {
      case 'on_time_count_3': {
        const count = db.prepare(`
          SELECT COUNT(*) as cnt FROM student_challenges
          WHERE student_id = ? AND is_on_time = 1
        `).get(userId)?.cnt || 0;
        earned = count >= 3;
        break;
      }
      case 'complete_count_5': {
        const count = db.prepare(`
          SELECT COUNT(*) as cnt FROM student_challenges
          WHERE student_id = ? AND status IN ('submitted','graded')
        `).get(userId)?.cnt || 0;
        earned = count >= 5;
        break;
      }
      case 'early_submission': {
        const count = db.prepare(`
          SELECT COUNT(*) as cnt FROM student_challenges sc
          JOIN challenges c ON c.id = sc.challenge_id
          WHERE sc.student_id = ? AND sc.submitted_at IS NOT NULL
            AND sc.submitted_at < datetime(c.deadline, '-5 minutes')
        `).get(userId)?.cnt || 0;
        earned = count >= 1;
        break;
      }
      case 'high_score_90': {
        const count = db.prepare(`
          SELECT COUNT(*) as cnt FROM scores s
          JOIN student_challenges sc ON sc.id = s.student_challenge_id
          WHERE sc.student_id = ? AND s.score >= 90
        `).get(userId)?.cnt || 0;
        earned = count >= 1;
        break;
      }
      case 'hard_challenge': {
        const count = db.prepare(`
          SELECT COUNT(*) as cnt FROM student_challenges sc
          JOIN challenges c ON c.id = sc.challenge_id
          WHERE sc.student_id = ? AND c.difficulty = 'hard' AND sc.status IN ('submitted','graded')
        `).get(userId)?.cnt || 0;
        earned = count >= 1;
        break;
      }
      case 'streak_5': {
        const submissions = db.prepare(`
          SELECT is_on_time FROM student_challenges
          WHERE student_id = ? AND submitted_at IS NOT NULL
          ORDER BY submitted_at ASC
        `).all(userId);
        let streak = 0, maxStreak = 0;
        for (const s of submissions) {
          if (s.is_on_time) { streak++; maxStreak = Math.max(maxStreak, streak); }
          else streak = 0;
        }
        earned = maxStreak >= 5;
        break;
      }
    }

    if (earned) {
      db.prepare('INSERT INTO student_badges (student_id, badge_id) VALUES (?, ?)').run(userId, badge.id);
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        userId, `ยินดีด้วย! ได้รับ Badge ใหม่ 🏆`,
        `คุณได้รับ Badge "${badge.name_th}" - ${badge.description}`, 'success'
      );
    }
  }
}

export function logActivity(userId, action, entityType = null, entityId = null, metadata = null) {
  try {
    const metaStr = metadata === null || metadata === undefined
      ? null
      : typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
    db.prepare('INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?)')
      .run(userId, action, entityType || null, entityId || null, metaStr);
  } catch (_) {
    // ไม่หยุดทำงานหากบันทึก log ไม่ได้
  }
}

