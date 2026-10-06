import express from 'express';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// helper: get class_id for teacher or student
function getClassId(user) {
  if (user.role === 'teacher') {
    const r = db.prepare('SELECT id FROM classes WHERE teacher_id = ?').get(user.id);
    return r?.id || null;
  } else {
    const r = db.prepare('SELECT class_id FROM class_enrollments WHERE student_id = ?').get(user.id);
    return r?.class_id || null;
  }
}

function getGroupsWithMembers(classId) {
  const groups = db.prepare('SELECT * FROM groups WHERE class_id = ? ORDER BY id').all(classId);
  return groups.map(g => {
    const members = db.prepare(`
      SELECT u.id, u.name, u.username, u.student_id as student_code
      FROM users u JOIN group_members gm ON gm.student_id = u.id
      WHERE gm.group_id = ? ORDER BY u.name
    `).all(g.id);
    const leader = g.leader_id ? db.prepare('SELECT id, name FROM users WHERE id = ?').get(g.leader_id) : null;
    return { ...g, members, leader };
  });
}

// GET /api/groups — ดูกลุ่มทั้งหมด (ทั้งครูและนักเรียน)
router.get('/', (req, res) => {
  const classId = getClassId(req.user);
  if (!classId) return res.json({ groups: [], myGroup: null });

  const groups = getGroupsWithMembers(classId);

  // ถ้าเป็นนักเรียน บอกว่าตัวเองอยู่กลุ่มไหน
  let myGroup = null;
  if (req.user.role === 'student') {
    myGroup = groups.find(g => g.members.some(m => m.id === req.user.id)) || null;
  }

  res.json({ groups, myGroup });
});

// POST /api/groups — ครูสร้างกลุ่ม หรือ นักเรียนสร้างกลุ่มของตัวเอง
router.post('/', (req, res) => {
  const { name, memberIds, leaderId } = req.body;
  const classId = getClassId(req.user);
  if (!classId) return res.status(400).json({ error: 'ไม่พบชั้นเรียน' });
  if (!name?.trim()) return res.status(400).json({ error: 'กรุณาตั้งชื่อกลุ่ม' });

  // ถ้านักเรียนสร้าง: ต้องออกจากกลุ่มเดิมก่อน
  if (req.user.role === 'student') {
    const existingGroup = db.prepare(`
      SELECT gm.group_id FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      WHERE gm.student_id = ? AND g.class_id = ?
    `).get(req.user.id, classId);
    if (existingGroup) {
      db.prepare('DELETE FROM group_members WHERE group_id = ? AND student_id = ?').run(existingGroup.group_id, req.user.id);
    }
  }

  const gId = db.prepare('INSERT INTO groups (class_id, name, leader_id) VALUES (?, ?, ?)').run(
    classId, name.trim(), req.user.role === 'student' ? req.user.id : (leaderId || null)
  ).lastInsertRowid;

  // เพิ่มสมาชิก
  const members = Array.isArray(memberIds) ? memberIds : [];
  if (req.user.role === 'student' && !members.includes(req.user.id)) members.push(req.user.id);

  if (members.length > 0) {
    const removeOther = db.prepare(`
      DELETE FROM group_members WHERE student_id = ? AND group_id IN (SELECT id FROM groups WHERE class_id = ?)
    `);
    members.forEach(sid => removeOther.run(sid, classId));
  }

  const stmt = db.prepare('INSERT OR IGNORE INTO group_members (group_id, student_id) VALUES (?, ?)');
  members.forEach(sid => stmt.run(gId, sid));

  if (!leaderId && members.length > 0) {
    db.prepare('UPDATE groups SET leader_id = ? WHERE id = ?').run(members[0], gId);
  }

  res.status(201).json({ message: 'สร้างกลุ่มสำเร็จ', groupId: gId });
});

// PUT /api/groups/:id — ครูแก้ไขกลุ่ม (ชื่อกลุ่ม, หัวหน้ากลุ่ม, สมาชิก)
router.put('/:id', requireRole('teacher'), (req, res) => {
  const groupId = req.params.id;
  const { name, leaderId, memberIds } = req.body;
  const classId = getClassId(req.user);
  if (!classId) return res.status(400).json({ error: 'ไม่พบชั้นเรียน' });

  const group = db.prepare('SELECT * FROM groups WHERE id = ? AND class_id = ?').get(groupId, classId);
  if (!group) return res.status(404).json({ error: 'ไม่พบกลุ่ม' });

  // อัปเดตชื่อกลุ่ม
  if (name && name.trim()) {
    db.prepare('UPDATE groups SET name = ? WHERE id = ?').run(name.trim(), groupId);
  }

  // อัปเดตสมาชิก
  if (Array.isArray(memberIds)) {
    // ลบนักเรียนเหล่านี้ออกจากกลุ่มอื่นในชั้นเดียวกันก่อน
    const removeOther = db.prepare(`
      DELETE FROM group_members WHERE student_id = ? AND group_id != ? AND group_id IN (SELECT id FROM groups WHERE class_id = ?)
    `);
    memberIds.forEach(sid => removeOther.run(sid, groupId, classId));

    // ล้างสมาชิกเดิมของกลุ่มนี้
    db.prepare('DELETE FROM group_members WHERE group_id = ?').run(groupId);

    // ใส่สมาชิกใหม่
    const insertMember = db.prepare('INSERT OR IGNORE INTO group_members (group_id, student_id) VALUES (?, ?)');
    memberIds.forEach(sid => insertMember.run(groupId, sid));
  }

  // อัปเดตหัวหน้ากลุ่ม
  if (leaderId !== undefined) {
    db.prepare('UPDATE groups SET leader_id = ? WHERE id = ?').run(leaderId || null, groupId);
  } else if (Array.isArray(memberIds)) {
    if (group.leader_id && !memberIds.includes(group.leader_id)) {
      const newLeader = memberIds.length > 0 ? memberIds[0] : null;
      db.prepare('UPDATE groups SET leader_id = ? WHERE id = ?').run(newLeader, groupId);
    } else if (!group.leader_id && memberIds.length > 0) {
      db.prepare('UPDATE groups SET leader_id = ? WHERE id = ?').run(memberIds[0], groupId);
    }
  }

  res.json({ message: 'แก้ไขกลุ่มสำเร็จ' });
});

// POST /api/groups/:id/members — ครูเพิ่มสมาชิกเข้ากลุ่ม
router.post('/:id/members', requireRole('teacher'), (req, res) => {
  const { studentId } = req.body;
  const groupId = req.params.id;
  const classId = getClassId(req.user);
  if (!studentId || !classId) return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });

  // ลบออกจากกลุ่มอื่นในชั้นนี้
  db.prepare(`
    DELETE FROM group_members WHERE student_id = ? AND group_id IN (SELECT id FROM groups WHERE class_id = ?)
  `).run(studentId, classId);

  // เพิ่มเข้ากลุ่มนี้
  db.prepare('INSERT OR IGNORE INTO group_members (group_id, student_id) VALUES (?, ?)').run(groupId, studentId);

  const g = db.prepare('SELECT leader_id FROM groups WHERE id = ?').get(groupId);
  if (!g?.leader_id) {
    db.prepare('UPDATE groups SET leader_id = ? WHERE id = ?').run(studentId, groupId);
  }

  res.json({ message: 'เพิ่มสมาชิกเรียบร้อย' });
});

// DELETE /api/groups/:id/members/:studentId — ครูลบสมาชิกออกจากกลุ่ม
router.delete('/:id/members/:studentId', requireRole('teacher'), (req, res) => {
  const { id: groupId, studentId } = req.params;
  db.prepare('DELETE FROM group_members WHERE group_id = ? AND student_id = ?').run(groupId, studentId);

  const g = db.prepare('SELECT leader_id FROM groups WHERE id = ?').get(groupId);
  if (g?.leader_id == studentId) {
    const nextMem = db.prepare('SELECT student_id FROM group_members WHERE group_id = ? LIMIT 1').get(groupId);
    db.prepare('UPDATE groups SET leader_id = ? WHERE id = ?').run(nextMem?.student_id || null, groupId);
  }

  res.json({ message: 'นำสมาชิกออกจากกลุ่มสำเร็จ' });
});

// DELETE /api/groups — ครูลบกลุ่มทั้งหมด
router.delete('/', requireRole('teacher'), (req, res) => {
  const classId = getClassId(req.user);
  if (!classId) return res.status(400).json({ error: 'ไม่พบชั้นเรียน' });
  const existing = db.prepare('SELECT id FROM groups WHERE class_id = ?').all(classId);
  existing.forEach(g => {
    db.prepare('DELETE FROM group_members WHERE group_id = ?').run(g.id);
    db.prepare('DELETE FROM group_canva_links WHERE group_id = ?').run(g.id);
    db.prepare('DELETE FROM groups WHERE id = ?').run(g.id);
  });
  res.json({ message: 'ลบกลุ่มทั้งหมดสำเร็จ' });
});

// POST /api/groups/:id/join — นักเรียนเข้าร่วมกลุ่ม
router.post('/:id/join', requireRole('student'), (req, res) => {
  const groupId = req.params.id;
  const classId = getClassId(req.user);
  const group = db.prepare('SELECT * FROM groups WHERE id = ? AND class_id = ?').get(groupId, classId);
  if (!group) return res.status(404).json({ error: 'ไม่พบกลุ่ม' });

  // ออกจากกลุ่มเดิมก่อน
  const existing = db.prepare(`
    SELECT gm.group_id FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
    WHERE gm.student_id = ? AND g.class_id = ?
  `).get(req.user.id, classId);
  if (existing) {
    db.prepare('DELETE FROM group_members WHERE group_id = ? AND student_id = ?').run(existing.group_id, req.user.id);
  }

  db.prepare('INSERT OR IGNORE INTO group_members (group_id, student_id) VALUES (?, ?)').run(groupId, req.user.id);
  res.json({ message: 'เข้าร่วมกลุ่มสำเร็จ' });
});

// POST /api/groups/:id/leave — นักเรียนออกจากกลุ่ม
router.post('/:id/leave', requireRole('student'), (req, res) => {
  db.prepare('DELETE FROM group_members WHERE group_id = ? AND student_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'ออกจากกลุ่มแล้ว' });
});

// POST /api/groups/random — ครูสุ่มจัดกลุ่ม
router.post('/random', requireRole('teacher'), (req, res) => {
  const { numGroups, groupSize } = req.body;
  const classId = getClassId(req.user);
  if (!classId) return res.status(400).json({ error: 'ไม่พบชั้นเรียน' });

  // ลบกลุ่มเดิมทั้งหมด
  const existing = db.prepare('SELECT id FROM groups WHERE class_id = ?').all(classId);
  existing.forEach(g => {
    db.prepare('DELETE FROM group_members WHERE group_id = ?').run(g.id);
    db.prepare('DELETE FROM groups WHERE id = ?').run(g.id);
  });

  const students = db.prepare(`
    SELECT u.id FROM users u JOIN class_enrollments ce ON ce.student_id = u.id WHERE ce.class_id = ?
  `).all(classId).map(r => r.id);

  // คำนวณจำนวนกลุ่ม
  let n = numGroups;
  if (!n && groupSize) n = Math.ceil(students.length / groupSize);
  if (!n || n < 1) return res.status(400).json({ error: 'กรุณาระบุจำนวนกลุ่มหรือขนาดกลุ่ม' });

  // Shuffle
  for (let i = students.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [students[i], students[j]] = [students[j], students[i]];
  }

  const groups = [];
  for (let i = 0; i < n; i++) {
    const gId = db.prepare('INSERT INTO groups (class_id, name) VALUES (?, ?)').run(
      classId, `กลุ่ม ${String(i + 1).padStart(2, '0')}`
    ).lastInsertRowid;
    groups.push({ id: gId, members: [] });
  }

  students.forEach((sid, i) => {
    const gIdx = i % n;
    db.prepare('INSERT INTO group_members (group_id, student_id) VALUES (?, ?)').run(groups[gIdx].id, sid);
    if (!groups[gIdx].leaderId) {
      db.prepare('UPDATE groups SET leader_id = ? WHERE id = ?').run(sid, groups[gIdx].id);
      groups[gIdx].leaderId = sid;
    }
    groups[gIdx].members.push(sid);
  });

  res.json({ message: `สร้าง ${n} กลุ่มสำเร็จ`, groups: getGroupsWithMembers(classId) });
});

// DELETE /api/groups/:id — ครูลบกลุ่ม
router.delete('/:id', requireRole('teacher'), (req, res) => {
  db.prepare('DELETE FROM group_members WHERE group_id = ?').run(req.params.id);
  db.prepare('DELETE FROM group_canva_links WHERE group_id = ?').run(req.params.id);
  db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
  res.json({ message: 'ลบกลุ่มสำเร็จ' });
});

// GET /api/groups/activity/:challengeId — ดู real-time ว่าใครกำลังทำงานหรือยังไม่ทำ
router.get('/activity/:challengeId', (req, res) => {
  const challengeId = req.params.challengeId;
  const classId = getClassId(req.user);
  if (!classId) return res.json({ activeCount: 0, inProgressCount: 0, notStartedCount: 0, submittedCount: 0, totalCount: 0, students: [], byGroup: [] });

  // ดึงนักเรียนทั้งหมดในห้องนี้ พร้อมสถานะการทำ challenge และกิจกรรมล่าสุด
  const allStudents = db.prepare(`
    SELECT u.id, u.name, u.username, u.student_id as student_code,
      g.id as group_id, g.name as group_name,
      sc.id as student_challenge_id, sc.status as challenge_status, sc.submitted_at, sc.is_on_time, sc.canva_link,
      ca.last_seen, ca.joined_at,
      CASE 
        WHEN ca.last_seen IS NOT NULL AND ca.last_seen > datetime('now', '-5 minutes') THEN 1 
        ELSE 0 
      END as is_active_now
    FROM users u
    JOIN class_enrollments ce ON ce.student_id = u.id AND ce.class_id = ?
    LEFT JOIN group_members gm ON gm.student_id = u.id AND gm.group_id IN (SELECT id FROM groups WHERE class_id = ?)
    LEFT JOIN groups g ON g.id = gm.group_id
    LEFT JOIN student_challenges sc ON sc.student_id = u.id AND sc.challenge_id = ?
    LEFT JOIN challenge_activity ca ON ca.student_id = u.id AND ca.challenge_id = ?
    WHERE u.role = 'student'
    ORDER BY u.name
  `).all(classId, classId, challengeId, challengeId);

  let activeCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let submittedCount = 0;

  const students = allStudents.map(s => {
    let workingStatus = 'not_started';
    let statusLabel = 'ยังไม่เริ่มทำ';

    if (s.submitted_at || s.canva_link || s.challenge_status === 'submitted' || s.challenge_status === 'graded') {
      workingStatus = 'submitted';
      statusLabel = 'ส่งงานแล้ว';
      submittedCount++;
    } else if (s.is_active_now === 1) {
      workingStatus = 'active';
      statusLabel = 'กำลังทำงานอยู่';
      activeCount++;
    } else if (s.challenge_status === 'in_progress' || s.student_challenge_id) {
      workingStatus = 'in_progress';
      statusLabel = 'ทำค้างไว้';
      inProgressCount++;
    } else {
      workingStatus = 'not_started';
      statusLabel = 'ยังไม่เริ่มทำ';
      notStartedCount++;
    }

    return {
      id: s.id,
      name: s.name,
      username: s.username,
      studentCode: s.student_code || s.username,
      groupId: s.group_id || null,
      groupName: s.group_name || 'ยังไม่มีกลุ่ม',
      workingStatus,
      statusLabel,
      isActiveNow: s.is_active_now === 1,
      lastSeen: s.last_seen || null,
      canvaLink: s.canva_link || null,
      submittedAt: s.submitted_at || null,
      isOnTime: s.is_on_time
    };
  });

  const byGroupMap = {};
  students.forEach(s => {
    const key = s.groupId || 'nogroup';
    if (!byGroupMap[key]) {
      byGroupMap[key] = {
        groupId: s.groupId,
        groupName: s.groupName,
        activeCount: 0,
        totalCount: 0,
        members: []
      };
    }
    byGroupMap[key].members.push(s);
    byGroupMap[key].totalCount++;
    if (s.isActiveNow) byGroupMap[key].activeCount++;
  });

  res.json({
    activeCount,
    inProgressCount,
    notStartedCount,
    submittedCount,
    totalCount: students.length,
    students,
    byGroup: Object.values(byGroupMap)
  });
});

// POST /api/groups/heartbeat — นักเรียน ping ว่ากำลังทำงานอยู่
router.post('/heartbeat', requireRole('student'), (req, res) => {
  const { challengeId, studentChallengeId } = req.body;
  if (!challengeId) return res.status(400).json({ error: 'Missing challengeId' });

  const classId = getClassId(req.user);
  const groupRow = classId ? db.prepare(`
    SELECT g.id FROM groups g JOIN group_members gm ON gm.group_id = g.id
    WHERE gm.student_id = ? AND g.class_id = ?
  `).get(req.user.id, classId) : null;

  let scId = Number(studentChallengeId) || 0;
  if (!scId) {
    let scRow = db.prepare('SELECT id FROM student_challenges WHERE student_id = ? AND challenge_id = ?').get(req.user.id, challengeId);
    if (!scRow) {
      try {
        const now = new Date().toISOString();
        const insertSc = db.prepare("INSERT INTO student_challenges (student_id, challenge_id, group_id, status, started_at) VALUES (?, ?, ?, 'in_progress', ?)").run(
          req.user.id, challengeId, groupRow?.id || null, now
        );
        scId = insertSc.lastInsertRowid;
      } catch (e) {
        scId = 0;
      }
    } else {
      scId = scRow.id;
    }
  }

  const existing = db.prepare('SELECT id FROM challenge_activity WHERE student_id = ? AND challenge_id = ?').get(req.user.id, challengeId);
  if (existing) {
    db.prepare("UPDATE challenge_activity SET last_seen = datetime('now'), is_active = 1, group_id = ?, student_challenge_id = COALESCE(NULLIF(?, 0), student_challenge_id) WHERE id = ?").run(
      groupRow?.id || null, scId, existing.id
    );
  } else {
    db.prepare('INSERT INTO challenge_activity (student_challenge_id, student_id, challenge_id, group_id, is_active, joined_at, last_seen) VALUES (?, ?, ?, ?, 1, datetime(\'now\'), datetime(\'now\'))').run(
      scId || 0, req.user.id, challengeId, groupRow?.id || null
    );
  }
  res.json({ ok: true, scId });
});

// GET /api/groups/summary/:challengeId — สรุปผลรายกลุ่มเมื่อทำเสร็จ
router.get('/summary/:challengeId', (req, res) => {
  const classId = getClassId(req.user);
  if (!classId) return res.json({ groups: [] });

  const groups = db.prepare('SELECT * FROM groups WHERE class_id = ? ORDER BY id').all(classId);
  const result = groups.map(g => {
    const members = db.prepare(`
      SELECT u.id, u.name, u.username,
        sc.status, sc.submitted_at, sc.is_on_time, sc.canva_link,
        s.score, s.graded_at,
        ca.joined_at, ca.last_seen,
        CASE WHEN ca.id IS NOT NULL THEN 1 ELSE 0 END as did_join
      FROM users u
      JOIN group_members gm ON gm.student_id = u.id AND gm.group_id = ?
      LEFT JOIN student_challenges sc ON sc.student_id = u.id AND sc.challenge_id = ?
      LEFT JOIN scores s ON s.student_challenge_id = sc.id
      LEFT JOIN challenge_activity ca ON ca.student_id = u.id AND ca.challenge_id = ?
      ORDER BY u.name
    `).all(g.id, req.params.challengeId, req.params.challengeId);

    const linkSubmission = db.prepare(`
      SELECT ls.canva_link, ls.submitted_at FROM link_submissions ls
      JOIN student_challenges sc ON sc.id = ls.student_challenge_id
      WHERE sc.challenge_id = ? AND sc.student_id IN (
        SELECT student_id FROM group_members WHERE group_id = ?
      ) LIMIT 1
    `).get(req.params.challengeId, g.id);

    const submitted = members.filter(m => m.submitted_at || m.canva_link);
    const avgScore = members.filter(m => m.score !== null && m.score !== undefined).reduce((s, m) => s + m.score, 0) / (members.filter(m => m.score !== null).length || 1);

    return {
      ...g, members,
      canvaLink: linkSubmission?.canva_link || null,
      submittedCount: submitted.length,
      avgScore: avgScore || null,
    };
  });

  res.json({ groups: result });
});

// GET /api/groups/canva-link/:challengeId — ดึงลิงก์ Canva ของกลุ่มตัวเอง
router.get('/canva-link/:challengeId', requireRole('student'), (req, res) => {
  const classId = getClassId(req.user);
  if (!classId) return res.json({ link: null, groupName: null });

  // หากลุ่มของนักเรียน
  const groupRow = db.prepare(`
    SELECT g.id, g.name FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE gm.student_id = ? AND g.class_id = ?
  `).get(req.user.id, classId);

  if (!groupRow) return res.json({ link: null, groupName: null, hasGroup: false });

  const linkRow = db.prepare(
    `SELECT gcl.*, u.name as set_by_name FROM group_canva_links gcl
     LEFT JOIN users u ON u.id = gcl.set_by
     WHERE gcl.group_id = ? AND gcl.challenge_id = ?`
  ).get(groupRow.id, req.params.challengeId);

  res.json({
    hasGroup: true,
    groupId: groupRow.id,
    groupName: groupRow.name,
    link: linkRow?.canva_link || null,
    setByName: linkRow?.set_by_name || null,
  });
});

// POST /api/groups/canva-link/:challengeId — ตั้งลิงก์ Canva ส่วนกลางของกลุ่ม
router.post('/canva-link/:challengeId', requireRole('student'), (req, res) => {
  const { canvaLink } = req.body;
  if (!canvaLink?.trim()) return res.status(400).json({ error: 'กรุณากรอกลิงก์ Canva' });

  const classId = getClassId(req.user);
  if (!classId) return res.status(400).json({ error: 'ไม่พบชั้นเรียน' });

  const groupRow = db.prepare(`
    SELECT g.id, g.name FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE gm.student_id = ? AND g.class_id = ?
  `).get(req.user.id, classId);

  if (!groupRow) return res.status(400).json({ error: 'คุณยังไม่ได้อยู่ในกลุ่ม' });

  // Upsert — INSERT OR REPLACE
  db.prepare(`
    INSERT INTO group_canva_links (group_id, challenge_id, canva_link, set_by)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(group_id, challenge_id) DO UPDATE SET canva_link = excluded.canva_link, set_by = excluded.set_by
  `).run(groupRow.id, req.params.challengeId, canvaLink.trim(), req.user.id);

  res.json({ message: 'ตั้งลิงก์ Canva สำหรับกลุ่มสำเร็จ', groupName: groupRow.name });
});

export default router;

