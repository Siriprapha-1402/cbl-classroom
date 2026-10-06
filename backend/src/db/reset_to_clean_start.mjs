import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', '..', 'cbl_classroom.db');
const db = new DatabaseSync(DB_PATH);

console.log('🧹 กำลังรีเซ็ตระบบให้เป็นค่าเริ่มต้นก่อนสร้างงานใหม่...\n');

// ล้างตารางที่เกี่ยวกับงาน การส่งงาน คะแนน และกลุ่มทั้งหมด
const tablesToClear = [
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
  'notifications',
  'activity_logs',
  'research_assessments',
  'research_skills',
];

for (const t of tablesToClear) {
  try {
    db.prepare(`DELETE FROM ${t}`).run();
    console.log(`  ✅ ล้างตาราง: ${t}`);
  } catch (e) {
    console.log(`  ⚠️  ข้าม ${t}: ${e.message}`);
  }
}

// ตรวจสอบความถูกต้องของบัญชีครูและนักเรียน
const teacherCount = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'teacher'").get().cnt;
const studentCount = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'student'").get().cnt;
const enrollCount  = db.prepare("SELECT COUNT(*) as cnt FROM class_enrollments").get().cnt;
const chalCount    = db.prepare("SELECT COUNT(*) as cnt FROM challenges").get().cnt;
const badgeCount   = db.prepare("SELECT COUNT(*) as cnt FROM badges").get().cnt;

console.log(`
╔═══════════════════════════════════════════════════╗
║         รีเซ็ตระบบเป็นค่าเริ่มต้นสำเร็จ!           ║
╠═══════════════════════════════════════════════════╣
║  👩‍🏫 บัญชีครูผู้สอน:    ${String(teacherCount).padEnd(3)} คน                    ║
║  👨‍🎓 นักเรียนในระบบ:   ${String(studentCount).padEnd(3)} คน                    ║
║  📋 ลงทะเบียนเรียน:    ${String(enrollCount).padEnd(3)} คน                    ║
║  🎯 Challenge:         ${String(chalCount).padEnd(3)} รายการ (พร้อมสร้างใหม่)  ║
║  🏅 Badges รางวัล:     ${String(badgeCount).padEnd(3)} เหรียญ                  ║
╚═══════════════════════════════════════════════════╝
`);

// Export ข้อมูลสะอาดลง initialData.json สำหรับ Vercel & Client-side
const allTables = [
  'users','classes','class_enrollments','groups','group_members','badges',
  'challenges','missions','checklist_items','student_challenges','submissions',
  'checklist_completions','mission_progress','reflections','activity_logs',
  'student_badges','scores','feedback','research_assessments','research_skills'
];
const exportData = {};
for (const t of allTables) {
  try {
    exportData[t] = db.prepare(`SELECT * FROM ${t}`).all();
  } catch(e) {
    exportData[t] = [];
  }
}

const initialDataPath = join(__dirname, '..', '..', '..', 'frontend', 'src', 'lib', 'initialData.json');
writeFileSync(initialDataPath, JSON.stringify(exportData, null, 2), 'utf8');
console.log(`💾 บันทึกค่าเริ่มต้นสะอาดลง ${initialDataPath} เรียบร้อยแล้ว!\n`);

db.close();
