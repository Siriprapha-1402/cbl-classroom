import db from './db.js';

export function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('teacher','student')),
      avatar TEXT DEFAULT NULL,
      student_id TEXT DEFAULT NULL,
      class_name TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      teacher_id INTEGER NOT NULL,
      academic_year TEXT DEFAULT '2567',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS class_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      leader_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      scenario TEXT,
      goals TEXT,
      deliverables TEXT,
      duration_minutes INTEGER DEFAULT 30,
      start_date DATETIME,
      deadline DATETIME,
      max_score INTEGER DEFAULT 100,
      rubric TEXT,
      difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
      group_size INTEGER DEFAULT 1,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','active','completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS challenge_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id INTEGER NOT NULL,
      order_num INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      xp_reward INTEGER DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id INTEGER NOT NULL,
      item_text TEXT NOT NULL,
      order_num INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      challenge_id INTEGER NOT NULL,
      group_id INTEGER DEFAULT NULL,
      status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started','in_progress','submitted','graded')),
      started_at DATETIME DEFAULT NULL,
      submitted_at DATETIME DEFAULT NULL,
      time_used_seconds INTEGER DEFAULT NULL,
      is_on_time INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mission_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_challenge_id INTEGER NOT NULL,
      mission_id INTEGER NOT NULL,
      status TEXT DEFAULT 'locked' CHECK(status IN ('locked','in_progress','completed')),
      completed_at DATETIME DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS checklist_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_challenge_id INTEGER NOT NULL,
      checklist_item_id INTEGER NOT NULL,
      checked INTEGER DEFAULT 0,
      checked_at DATETIME DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_challenge_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT,
      file_type TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submission_status TEXT DEFAULT 'on_time' CHECK(submission_status IN ('on_time','near_deadline','late'))
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_challenge_id INTEGER NOT NULL UNIQUE,
      teacher_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      max_score INTEGER DEFAULT 100,
      graded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_challenge_id INTEGER NOT NULL UNIQUE,
      teacher_id INTEGER NOT NULL,
      strengths TEXT,
      improvements TEXT,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reflections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_challenge_id INTEGER NOT NULL UNIQUE,
      q1 TEXT,
      q2 TEXT,
      q3 TEXT,
      q4 TEXT,
      self_score INTEGER CHECK(self_score BETWEEN 1 AND 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS xp_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      challenge_id INTEGER DEFAULT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_th TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      criteria_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      badge_id INTEGER NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK(type IN ('info','success','warning','danger')),
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ติดตามว่านักเรียนคนไหนกดเข้าทำงาน Challenge นี้อยู่
    CREATE TABLE IF NOT EXISTS challenge_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_challenge_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      challenge_id INTEGER NOT NULL,
      group_id INTEGER,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    );

    -- เพิ่ม canva_link ใน submissions (ถ้ายังไม่มี)
    CREATE TABLE IF NOT EXISTS link_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_challenge_id INTEGER NOT NULL UNIQUE,
      canva_link TEXT NOT NULL,
      note TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: เพิ่ม canva_link ในตาราง student_challenges ถ้ายังไม่มี
  try {
    db.exec(`ALTER TABLE student_challenges ADD COLUMN canva_link TEXT DEFAULT NULL`);
  } catch(_) {}

  // Migration: เพิ่ม group_name ใน groups ถ้ายังไม่มี
  try {
    db.exec(`ALTER TABLE groups ADD COLUMN max_size INTEGER DEFAULT 6`);
  } catch(_) {}

  // Migration: ลิงก์ Canva ส่วนกลางของกลุ่มต่อ challenge
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS group_canva_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      challenge_id INTEGER NOT NULL,
      canva_link TEXT NOT NULL,
      set_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, challenge_id)
    )`);
  } catch(_) {}

  // Migration: ตารางแบบบันทึกพฤติกรรมการส่งงานของนักเรียน (3 ด้าน)
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS behavior_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL DEFAULT 1,
      challenge_id INTEGER DEFAULT NULL,
      session_name TEXT DEFAULT 'ทั่วไป',
      student_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('on_time', 'late', 'missing')),
      note TEXT DEFAULT NULL,
      evaluated_by INTEGER NOT NULL,
      evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(class_id, challenge_id, session_name, student_id)
    )`);
  } catch(_) {}

  // Migration: ตารางแบบประเมินทักษะการปฏิบัติงาน (4 ด้าน 21 ข้อ 5 ระดับ)
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS skill_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL DEFAULT 1,
      student_id INTEGER NOT NULL,
      challenge_id INTEGER DEFAULT NULL,
      assessment_type TEXT NOT NULL DEFAULT 'post' CHECK(assessment_type IN ('pre', 'post', 'during', 'custom')),
      round_title TEXT DEFAULT 'ประเมินหลังจัดการเรียนรู้',
      scores_json TEXT NOT NULL,
      total_score INTEGER NOT NULL,
      score_percentage REAL NOT NULL,
      quality_level TEXT NOT NULL,
      comments TEXT DEFAULT NULL,
      evaluator_name TEXT DEFAULT 'นางสาวศิริประภา สมบัติคำ',
      evaluated_by INTEGER NOT NULL,
      evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, assessment_type, challenge_id, round_title)
    )`);
  } catch(_) {}

  // Migration: ตารางผลแบบทดสอบก่อนเรียนและหลังเรียน (Pre-test / Post-test)
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS quiz_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      quiz_type TEXT NOT NULL CHECK(quiz_type IN ('pre', 'post')),
      score INTEGER NOT NULL,
      total_score INTEGER NOT NULL DEFAULT 10,
      answers_json TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, quiz_type)
    )`);
  } catch(_) {}

  console.log('✅ Database schema initialized');
}

export default initializeSchema;

