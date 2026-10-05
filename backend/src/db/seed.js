import bcrypt from 'bcryptjs';
import { initializeSchema } from './schema.js';
import db from './db.js';

function seed() {
  initializeSchema();

  // Check if already seeded
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('teacher01');
  if (existingUser) {
    console.log('⚠️  Database already seeded. Skipping.');
    return;
  }

  console.log('🌱 Seeding database...');

  const hash = bcrypt.hashSync('password123', 10);
  const now = new Date();

  // ─── USERS ───────────────────────────────────────────────────────────────
  const insertUser = db.prepare(`
    INSERT INTO users (name, username, password_hash, role, student_id, class_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const teacherId = insertUser.run('อาจารย์สมชาย ใจดี', 'teacher01', hash, 'teacher', null, null).lastInsertRowid;

  const studentNames = [
    'สมศักดิ์ มีสุข', 'วิภาพร แสงจันทร์', 'ธนกร รักเรียน',
    'พิมพ์ใจ สดใส', 'กิตติพงษ์ เก่งกล้า', 'นันทิดา ขยัน',
    'อภิชาติ ตั้งใจ', 'มณีรัตน์ หมั่นเพียร', 'ชัยพร บากบั่น', 'ปิยะนุช ศึกษาดี'
  ];

  const studentIds = studentNames.map((name, i) => {
    const id = insertUser.run(name, `student0${i + 1}`, hash, 'student', `STU00${i + 1}`, 'ปวช.1/1').lastInsertRowid;
    return id;
  });

  // ─── CLASS ────────────────────────────────────────────────────────────────
  const classId = db.prepare(`INSERT INTO classes (name, teacher_id, academic_year) VALUES (?, ?, ?)`).run('ปวช.1/1', teacherId, '2567').lastInsertRowid;

  // ─── ENROLLMENTS ──────────────────────────────────────────────────────────
  const enrollStmt = db.prepare(`INSERT INTO class_enrollments (student_id, class_id) VALUES (?, ?)`);
  studentIds.forEach(sid => enrollStmt.run(sid, classId));

  // ─── GROUPS ───────────────────────────────────────────────────────────────
  const g1Id = db.prepare(`INSERT INTO groups (class_id, name, leader_id) VALUES (?, ?, ?)`).run(classId, 'กลุ่ม 01', studentIds[0]).lastInsertRowid;
  const g2Id = db.prepare(`INSERT INTO groups (class_id, name, leader_id) VALUES (?, ?, ?)`).run(classId, 'กลุ่ม 02', studentIds[5]).lastInsertRowid;

  const gmStmt = db.prepare(`INSERT INTO group_members (group_id, student_id) VALUES (?, ?)`);
  studentIds.slice(0, 5).forEach(sid => gmStmt.run(g1Id, sid));
  studentIds.slice(5, 10).forEach(sid => gmStmt.run(g2Id, sid));

  // ─── BADGES ───────────────────────────────────────────────────────────────
  const badgeStmt = db.prepare(`INSERT INTO badges (name, name_th, description, icon, criteria_type) VALUES (?, ?, ?, ?, ?)`);
  const b1 = badgeStmt.run('Deadline Hero', 'วีรบุรุษ Deadline', 'ส่งงานตรงเวลา 3 ครั้ง', '🏆', 'on_time_count_3').lastInsertRowid;
  const b2 = badgeStmt.run('Challenge Master', 'นักพิชิต Challenge', 'ผ่าน Challenge 5 ครั้ง', '⭐', 'complete_count_5').lastInsertRowid;
  const b3 = badgeStmt.run('Early Bird', 'นกตื่นเช้า', 'ส่งงานก่อน Deadline', '🐦', 'early_submission').lastInsertRowid;
  const b4 = badgeStmt.run('Creative Thinker', 'นักคิดสร้างสรรค์', 'ได้คะแนน 90 ขึ้นไป', '💡', 'high_score_90').lastInsertRowid;
  const b5 = badgeStmt.run('Problem Solver', 'นักแก้ปัญหา', 'ผ่าน Challenge ระดับยาก', '🎯', 'hard_challenge').lastInsertRowid;
  const b6 = badgeStmt.run('Consistency', 'ความสม่ำเสมอ', 'ส่งตรงเวลา 5 ครั้งติดต่อกัน', '🔥', 'streak_5').lastInsertRowid;

  // ─── CHALLENGES ───────────────────────────────────────────────────────────
  const challengeStmt = db.prepare(`
    INSERT INTO challenges (class_id, teacher_id, title, description, scenario, goals, deliverables, duration_minutes, start_date, deadline, max_score, rubric, difficulty, group_size, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const future7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const past3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const future3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const future14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const c1Id = challengeStmt.run(classId, teacherId,
    'Product Presentation Challenge',
    'สร้าง Presentation เพื่อนำเสนอสมาร์ทโฟนรุ่นใหม่ของบริษัท TechVision',
    'บริษัท TechVision กำลังจะเปิดตัวสมาร์ทโฟนรุ่นใหม่ล่าสุด และต้องการ Presentation ที่น่าสนใจเพื่อใช้ในการประชาสัมพันธ์สินค้าให้กับกลุ่มลูกค้าเป้าหมายอายุ 18-25 ปี ทีมของคุณจะต้องสร้าง Presentation ที่ดึงดูดใจและสื่อสารจุดเด่นของสินค้าได้อย่างชัดเจน',
    'สร้าง Presentation ที่นำเสนอสมาร์ทโฟนรุ่นใหม่ได้อย่างน่าสนใจ ตรงกับกลุ่มเป้าหมาย',
    'Presentation 5-7 slides, ไฟล์ PDF, ไฟล์ต้นฉบับ',
    30, past7, future7, 100,
    'เนื้อหา (40%), การออกแบบ (30%), ความคิดสร้างสรรค์ (20%), การนำเสนอ (10%)',
    'medium', 1, 'active').lastInsertRowid;

  const c2Id = challengeStmt.run(classId, teacherId,
    'Tourism Presentation Challenge',
    'สร้าง Presentation เพื่อโปรโมทสถานที่ท่องเที่ยวในจังหวัดเชียงใหม่',
    'สำนักงานการท่องเที่ยวจังหวัดเชียงใหม่ต้องการ Presentation เพื่อโปรโมทสถานที่ท่องเที่ยวให้กับนักท่องเที่ยวต่างชาติ โดยเน้นวัฒนธรรม ธรรมชาติ และอาหารพื้นเมือง',
    'สร้าง Presentation ที่ดึงดูดนักท่องเที่ยวต่างชาติให้สนใจมาเที่ยวเชียงใหม่',
    'Presentation 6-8 slides, ภาพประกอบสวยงาม, ไฟล์ PDF',
    45, past7, past3, 100,
    'เนื้อหา (35%), ความสวยงาม (35%), ความถูกต้อง (20%), ภาษา (10%)',
    'medium', 1, 'active').lastInsertRowid;

  const c3Id = challengeStmt.run(classId, teacherId,
    'Business Pitch Challenge',
    'สร้าง Pitch Deck สำหรับธุรกิจ StartUp ของตัวเอง',
    'คุณกำลังเป็นผู้ประกอบการรุ่นใหม่ที่ต้องการระดมทุนจากนักลงทุน คุณมีเวลา 3 นาทีในการนำเสนอไอเดียธุรกิจของคุณ Pitch Deck ต้องโน้มน้าวใจนักลงทุนให้เห็นถึงโอกาสทางธุรกิจ',
    'สร้าง Pitch Deck ที่โน้มน้าวนักลงทุนได้จริง',
    'Pitch Deck 8-10 slides, ไฟล์ PDF',
    40, now.toISOString(), future3, 100,
    'ความโน้มน้าวใจ (40%), ความเป็นไปได้ (30%), การออกแบบ (20%), การนำเสนอ (10%)',
    'hard', 1, 'active').lastInsertRowid;

  const c4Id = challengeStmt.run(classId, teacherId,
    'Technology Presentation Challenge',
    'อธิบายเทคโนโลยี AI ให้กับนักเรียนมัธยมศึกษา',
    'โรงเรียนมัธยมศึกษาต้องการให้คุณมาบรรยายเรื่อง AI และการประยุกต์ใช้ในชีวิตประจำวันให้นักเรียน ม.3 ฟัง Presentation ต้องเข้าใจง่ายและน่าสนใจสำหรับเด็กอายุ 15 ปี',
    'สร้าง Presentation อธิบาย AI ให้เข้าใจง่ายและน่าสนใจ',
    'Presentation 5-6 slides, ไฟล์ PDF',
    35, now.toISOString(), future7, 100,
    'ความเข้าใจง่าย (40%), ความน่าสนใจ (30%), ความถูกต้อง (30%)',
    'easy', 1, 'active').lastInsertRowid;

  const c5Id = challengeStmt.run(classId, teacherId,
    'Social Media Marketing Challenge',
    'วางแผน Social Media Marketing สำหรับแบรนด์แฟชั่น',
    'แบรนด์แฟชั่นรุ่นใหม่ต้องการกลยุทธ์ Social Media Marketing สำหรับ TikTok และ Instagram ทีมของคุณต้องนำเสนอแผนการตลาดที่น่าสนใจและทำได้จริง',
    'วางแผน Social Media Marketing ที่มีประสิทธิภาพและทำได้จริง',
    'Presentation 6-8 slides, ตัวอย่างคอนเทนต์, ไฟล์ PDF',
    30, now.toISOString(), future14, 100,
    'กลยุทธ์ (35%), ความสร้างสรรค์ (35%), ความเป็นไปได้ (20%), การนำเสนอ (10%)',
    'medium', 1, 'active').lastInsertRowid;

  const challengeIds = [c1Id, c2Id, c3Id, c4Id, c5Id];

  // ─── MISSIONS per challenge ────────────────────────────────────────────────
  const missionStmt = db.prepare(`INSERT INTO missions (challenge_id, order_num, title, description, xp_reward) VALUES (?, ?, ?, ?, ?)`);
  const defaultMissions = [
    ['วิเคราะห์โจทย์และกลุ่มเป้าหมาย', 'วิเคราะห์สถานการณ์และระบุกลุ่มเป้าหมายของ Presentation', 10],
    ['วางโครงสร้าง Presentation', 'กำหนดหัวข้อหลักและลำดับเนื้อหาของแต่ละ Slide', 10],
    ['สร้าง Slide ต้นแบบ', 'สร้าง Slide แรกพร้อม Template ที่เหมาะสม', 10],
    ['เพิ่มเนื้อหาและภาพประกอบ', 'เพิ่มเนื้อหาครบถ้วนพร้อมภาพประกอบที่เหมาะสม', 10],
    ['ตรวจสอบและปรับแต่ง', 'ตรวจสอบเนื้อหา การสะกด และความสวยงามโดยรวม', 10],
    ['ส่งผลงาน', 'บันทึกไฟล์และส่งผลงานตามรูปแบบที่กำหนด', 10],
  ];

  const missionIdsByChal = {};
  challengeIds.forEach(cid => {
    missionIdsByChal[cid] = defaultMissions.map(([title, desc, xp], i) =>
      missionStmt.run(cid, i + 1, title, desc, xp).lastInsertRowid
    );
  });

  // ─── CHECKLIST ITEMS ──────────────────────────────────────────────────────
  const checklistStmt = db.prepare(`INSERT INTO checklist_items (challenge_id, item_text, order_num) VALUES (?, ?, ?)`);
  const defaultChecklist = [
    'มีหน้าปกพร้อมชื่อผู้จัดทำ',
    'เนื้อหาครบถ้วนตามโจทย์',
    'มีภาพประกอบที่เหมาะสม',
    'จัดวางองค์ประกอบสวยงาม',
    'ใช้สีที่เหมาะสมและกลมกลืน',
    'ข้อความอ่านง่าย ขนาดตัวอักษรเหมาะสม',
    'ตรวจคำผิดแล้ว',
    'จำนวน Slide ตรงตามที่กำหนด',
    'บันทึกไฟล์ถูกรูปแบบ',
    'ตรวจสอบผลงานครั้งสุดท้ายก่อนส่ง',
  ];

  const checklistIdsByChal = {};
  challengeIds.forEach(cid => {
    checklistIdsByChal[cid] = defaultChecklist.map((text, i) =>
      checklistStmt.run(cid, text, i + 1).lastInsertRowid
    );
  });

  // ─── STUDENT CHALLENGE DATA ───────────────────────────────────────────────
  const scStmt = db.prepare(`
    INSERT INTO student_challenges (student_id, challenge_id, group_id, status, started_at, submitted_at, time_used_seconds, is_on_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const submissionStmt = db.prepare(`
    INSERT INTO submissions (student_challenge_id, file_name, file_path, file_type, submitted_at, submission_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const scoreStmt = db.prepare(`INSERT INTO scores (student_challenge_id, teacher_id, score, max_score, graded_at) VALUES (?, ?, ?, ?, ?)`);
  const feedbackStmt = db.prepare(`INSERT INTO feedback (student_challenge_id, teacher_id, strengths, improvements, comment) VALUES (?, ?, ?, ?, ?)`);
  const reflectionStmt = db.prepare(`INSERT INTO reflections (student_challenge_id, q1, q2, q3, q4, self_score) VALUES (?, ?, ?, ?, ?, ?)`);
  const xpStmt = db.prepare(`INSERT INTO xp_log (student_id, amount, reason, challenge_id, earned_at) VALUES (?, ?, ?, ?, ?)`);
  const missionProgStmt = db.prepare(`INSERT INTO mission_progress (student_challenge_id, mission_id, status, completed_at) VALUES (?, ?, ?, ?)`);

  // Challenge 1 - all graded/submitted
  const c1Scores = [85, 92, 78, 88, 95, 72, 83, 90, null, null];
  const c1OnTime = [1, 1, 1, 1, 0, 1, 0, 1, 1, 0];

  studentIds.forEach((sid, i) => {
    const groupId = i < 5 ? g1Id : g2Id;
    const status = i < 8 ? 'graded' : (i === 8 ? 'submitted' : 'in_progress');
    const startedAt = new Date(now.getTime() - 10 * 24 * 3600000).toISOString();
    const submittedAt = i < 9 ? new Date(now.getTime() - 8 * 24 * 3600000).toISOString() : null;
    const timeUsed = i < 9 ? Math.floor(Math.random() * 900 + 1200) : null;
    const isOnTime = i < 9 ? c1OnTime[i] : null;

    const scId = scStmt.run(sid, c1Id, groupId, status, startedAt, submittedAt, timeUsed, isOnTime).lastInsertRowid;

    // missions
    missionIdsByChal[c1Id].forEach((mid, mi) => {
      const mStatus = status === 'in_progress' ? (mi < 3 ? 'completed' : (mi === 3 ? 'in_progress' : 'locked'))
        : (status !== 'not_started' ? 'completed' : 'locked');
      missionProgStmt.run(scId, mid, mStatus, mStatus === 'completed' ? startedAt : null);
    });

    if (i < 9 && submittedAt) {
      submissionStmt.run(scId, `presentation_challenge1_student${i+1}.pptx`, `uploads/demo_${i+1}.pptx`, 'pptx', submittedAt, c1OnTime[i] ? 'on_time' : 'late');
    }

    if (i < 8 && c1Scores[i]) {
      const gradedAt = new Date(now.getTime() - 5 * 24 * 3600000).toISOString();
      scoreStmt.run(scId, teacherId, c1Scores[i], 100, gradedAt);
      feedbackStmt.run(scId, teacherId,
        'การเลือกภาพประกอบเหมาะสมกับกลุ่มเป้าหมาย ออกแบบ Slide สวยงาม',
        'ควรลดข้อความในบางสไลด์ เพิ่มพื้นที่ว่างให้มากขึ้น',
        'ผลงานดีมาก พยายามต่อไปนะ!');

      // XP for graded students
      xpStmt.run(sid, 5, 'เริ่ม Challenge', c1Id, startedAt);
      xpStmt.run(sid, 60, 'ทำ Mission สำเร็จทั้งหมด', c1Id, startedAt);
      xpStmt.run(sid, 20, 'ส่งผลงาน', c1Id, submittedAt);
      if (c1OnTime[i]) xpStmt.run(sid, 30, 'ส่งตรงเวลา', c1Id, submittedAt);
      if (c1Scores[i] >= 80) xpStmt.run(sid, 25, 'คะแนนผ่านเกณฑ์', c1Id, gradedAt);

      reflectionStmt.run(scId,
        'ได้เรียนรู้เรื่องการออกแบบ Presentation ที่มีประสิทธิภาพ',
        'การคิดหัวข้อและการจัดลำดับเนื้อหา',
        'ค้นหาข้อมูลเพิ่มเติมและปรึกษาเพื่อน',
        'จะวางแผนให้ดีขึ้นและเริ่มทำเร็วกว่านี้',
        c1Scores[i] >= 85 ? 5 : (c1Scores[i] >= 75 ? 4 : 3));
      xpStmt.run(sid, 10, 'ทำ Reflection', c1Id, gradedAt);
    }
  });

  // Challenge 2 - mostly graded
  const c2Scores = [88, 75, 82, 91, 70, 85, 79, null, null, null];
  const c2OnTime = [1, 1, 0, 1, 1, 1, 0, 0, 0, 0];

  studentIds.forEach((sid, i) => {
    const groupId = i < 5 ? g1Id : g2Id;
    const status = i < 7 ? 'graded' : (i < 9 ? 'submitted' : 'not_started');
    const startedAt = new Date(now.getTime() - 5 * 24 * 3600000).toISOString();
    const submittedAt = i < 9 ? new Date(now.getTime() - 4 * 24 * 3600000).toISOString() : null;
    const timeUsed = i < 9 ? Math.floor(Math.random() * 1200 + 1500) : null;

    const scId = scStmt.run(sid, c2Id, groupId, status, status !== 'not_started' ? startedAt : null, submittedAt, timeUsed, i < 9 ? c2OnTime[i] : null).lastInsertRowid;

    missionIdsByChal[c2Id].forEach((mid, mi) => {
      const mStatus = status === 'not_started' ? 'locked' : (status === 'graded' || status === 'submitted' ? 'completed' : (mi < 2 ? 'completed' : 'locked'));
      missionProgStmt.run(scId, mid, mStatus, mStatus === 'completed' ? startedAt : null);
    });

    if (i < 9 && submittedAt) {
      submissionStmt.run(scId, `tourism_challenge2_student${i+1}.pptx`, `uploads/demo_t${i+1}.pptx`, 'pptx', submittedAt, c2OnTime[i] ? 'on_time' : 'late');
    }

    if (i < 7 && c2Scores[i]) {
      const gradedAt = new Date(now.getTime() - 2 * 24 * 3600000).toISOString();
      scoreStmt.run(scId, teacherId, c2Scores[i], 100, gradedAt);
      feedbackStmt.run(scId, teacherId, 'เนื้อหาน่าสนใจ ภาพสวยงาม', 'ควรเพิ่มข้อมูลการเดินทางให้ครบถ้วน', 'ดีมาก!');

      xpStmt.run(sid, 5, 'เริ่ม Challenge', c2Id, startedAt);
      xpStmt.run(sid, 60, 'ทำ Mission สำเร็จทั้งหมด', c2Id, startedAt);
      xpStmt.run(sid, 20, 'ส่งผลงาน', c2Id, submittedAt);
      if (c2OnTime[i]) xpStmt.run(sid, 30, 'ส่งตรงเวลา', c2Id, submittedAt);
      if (c2Scores[i] >= 80) xpStmt.run(sid, 25, 'คะแนนผ่านเกณฑ์', c2Id, gradedAt);

      reflectionStmt.run(scId,
        'เรียนรู้การนำเสนอแหล่งท่องเที่ยวอย่างน่าสนใจ',
        'การเลือกภาพที่เหมาะสม',
        'ค้นคว้าข้อมูลจากหลายแหล่ง',
        'จะเพิ่มข้อมูลให้ครบถ้วนกว่านี้',
        c2Scores[i] >= 85 ? 5 : 4);
      xpStmt.run(sid, 10, 'ทำ Reflection', c2Id, gradedAt);
    }
  });

  // Challenge 3 - in_progress for first 5 students
  studentIds.slice(0, 5).forEach((sid, i) => {
    const groupId = i < 5 ? g1Id : g2Id;
    const startedAt = new Date(now.getTime() - 1 * 3600000).toISOString();
    const scId = scStmt.run(sid, c3Id, groupId, 'in_progress', startedAt, null, null, null).lastInsertRowid;
    xpStmt.run(sid, 5, 'เริ่ม Challenge', c3Id, startedAt);
    missionIdsByChal[c3Id].forEach((mid, mi) => {
      const mStatus = mi === 0 ? 'in_progress' : 'locked';
      missionProgStmt.run(scId, mid, mStatus, null);
    });
  });

  // Challenges 4 & 5 - not started for all
  [c4Id, c5Id].forEach(cid => {
    studentIds.forEach((sid, i) => {
      const groupId = i < 5 ? g1Id : g2Id;
      scStmt.run(sid, cid, groupId, 'not_started', null, null, null, null);
    });
  });

  // ─── BADGES for top students ──────────────────────────────────────────────
  const sbStmt = db.prepare(`INSERT INTO student_badges (student_id, badge_id, earned_at) VALUES (?, ?, ?)`);
  // student01 gets Deadline Hero, Early Bird, Creative Thinker
  sbStmt.run(studentIds[0], b1, new Date(now.getTime() - 4 * 24 * 3600000).toISOString());
  sbStmt.run(studentIds[0], b3, new Date(now.getTime() - 4 * 24 * 3600000).toISOString());
  sbStmt.run(studentIds[0], b4, new Date(now.getTime() - 2 * 24 * 3600000).toISOString());
  // student04 gets Creative Thinker
  sbStmt.run(studentIds[3], b4, new Date(now.getTime() - 2 * 24 * 3600000).toISOString());
  // student05 gets Early Bird
  sbStmt.run(studentIds[4], b3, new Date(now.getTime() - 5 * 24 * 3600000).toISOString());

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  const notifStmt = db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`);
  notifStmt.run(studentIds[0], 'ยินดีด้วย! 🏆', 'คุณได้รับ Badge "Deadline Hero" จากการส่งงานตรงเวลา 3 ครั้ง!', 'success');
  notifStmt.run(studentIds[0], 'ครูตรวจงานแล้ว ✅', 'ครูตรวจ Product Presentation Challenge แล้ว คะแนน 85/100', 'info');
  notifStmt.run(studentIds[0], 'ยินดีด้วย! ⭐', 'คุณได้รับ Badge "Creative Thinker" คะแนนสูงสุดในคลาส!', 'success');
  notifStmt.run(teacherId, 'มีผลงานรอตรวจ 📋', 'นักเรียน 2 คนส่งงาน Tourism Presentation Challenge รอการตรวจ', 'warning');
  notifStmt.run(teacherId, 'สรุปสัปดาห์', 'อัตราการส่งงานตรงเวลาสัปดาห์นี้ 75%', 'info');

  // ─── ACTIVITY LOGS ────────────────────────────────────────────────────────
  const actStmt = db.prepare(`INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
  actStmt.run(teacherId, 'LOGIN', 'user', teacherId, null, new Date(now.getTime() - 12 * 3600000).toISOString());
  studentIds.slice(0, 5).forEach((sid, i) => {
    actStmt.run(sid, 'LOGIN', 'user', sid, null, new Date(now.getTime() - (10 - i) * 3600000).toISOString());
    actStmt.run(sid, 'START_CHALLENGE', 'challenge', c1Id, JSON.stringify({ challengeTitle: 'Product Presentation' }), new Date(now.getTime() - (9 - i) * 3600000).toISOString());
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📋 Demo Accounts:');
  console.log('  Teacher: teacher01 / password123');
  console.log('  Students: student01 - student10 / password123');
}

seed();
