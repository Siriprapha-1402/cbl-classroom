import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', '..', 'cbl_classroom.db');
const db = new DatabaseSync(DB_PATH);

console.log('🧹 กำลังล้างข้อมูลทั้งหมด...\n');

// ล้างทุกตารางยกเว้น users, classes, class_enrollments
const tables = [
  'checklist_completions',
  'mission_progress',
  'submissions',
  'scores',
  'feedback',
  'reflections',
  'student_challenges',
  'checklist_items',
  'missions',
  'challenge_files',
  'challenges',
  'group_members',
  'groups',
  'xp_log',
  'student_badges',
  'badges',
  'notifications',
  'activity_logs',
];

for (const table of tables) {
  try {
    db.prepare(`DELETE FROM ${table}`).run();
    console.log(`  ✅ ล้าง ${table}`);
  } catch (e) {
    console.log(`  ⚠️  ข้าม ${table}: ${e.message}`);
  }
}

// ตรวจสอบผลลัพธ์
const userCount   = db.prepare("SELECT COUNT(*) as cnt FROM users").get().cnt;
const teacherCount = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role='teacher'").get().cnt;
const studentCount = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role='student'").get().cnt;
const enrollCount  = db.prepare("SELECT COUNT(*) as cnt FROM class_enrollments").get().cnt;
const chalCount    = db.prepare("SELECT COUNT(*) as cnt FROM challenges").get().cnt;

console.log(`
╔═════════════════════════════════════╗
║        ล้างข้อมูลเสร็จสมบูรณ์!      ║
╠═════════════════════════════════════╣
║  👤 ครูในระบบ:        ${String(teacherCount).padEnd(3)} คน          ║
║  👨‍🎓 นักเรียนในระบบ:  ${String(studentCount).padEnd(3)} คน          ║
║  📋 ลงทะเบียนเรียน:   ${String(enrollCount).padEnd(3)} คน           ║
║  🎯 Challenge:        ${String(chalCount).padEnd(3)} รายการ       ║
╚═════════════════════════════════════╝

พร้อมใช้งานจริงแล้ว!
`);

db.close();
