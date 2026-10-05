import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', '..', 'cbl_classroom.db');
const db = new DatabaseSync(DB_PATH);

// รายชื่อนักเรียนจาก Google Sheets เท่านั้น (รหัสนักเรียน = username)
const KEEP_STUDENT_IDS = [
  '69219100001','69219100002','69219100003','69219100004','69219100005',
  '69219100006','69219100007','69219100008','69219100009','69219100010',
  '69219100011','69219100012','69219100013','69219100014','69219100015',
  '69219100016','69219100017','69219100018','69219100019','69219100020',
  '69219100021','69219100022','69219100023','69219100024','69219100025',
  '69219100026','69219100027','69219100028','69219100029','69219100030',
  '69219100031','69219100032','69219100033','69219100034','69219100035',
  '69219100036','69219100037','69219100038','69219100039','69219100040',
  '69219100041','69219100042','69219100043',
];

// ดึงนักเรียนทั้งหมด
const allStudents = db.prepare("SELECT id, name, username FROM users WHERE role = 'student'").all();

const toDelete = allStudents.filter(s => !KEEP_STUDENT_IDS.includes(s.username));
const toKeep   = allStudents.filter(s =>  KEEP_STUDENT_IDS.includes(s.username));

console.log(`📋 นักเรียนทั้งหมดในฐานข้อมูล: ${allStudents.length} คน`);
console.log(`✅ เก็บไว้:  ${toKeep.length} คน`);
console.log(`🗑️  ลบออก:   ${toDelete.length} คน\n`);

if (toDelete.length > 0) {
  toDelete.forEach(s => {
    // ลบข้อมูลที่เกี่ยวข้องทั้งหมดก่อน
    const scIds = db.prepare('SELECT id FROM student_challenges WHERE student_id = ?').all(s.id).map(r => r.id);
    scIds.forEach(scId => {
      db.prepare('DELETE FROM submissions WHERE student_challenge_id = ?').run(scId);
      db.prepare('DELETE FROM scores WHERE student_challenge_id = ?').run(scId);
      db.prepare('DELETE FROM feedback WHERE student_challenge_id = ?').run(scId);
      db.prepare('DELETE FROM reflections WHERE student_challenge_id = ?').run(scId);
      db.prepare('DELETE FROM mission_progress WHERE student_challenge_id = ?').run(scId);
      db.prepare('DELETE FROM checklist_completions WHERE student_challenge_id = ?').run(scId);
    });
    db.prepare('DELETE FROM student_challenges WHERE student_id = ?').run(s.id);
    db.prepare('DELETE FROM class_enrollments WHERE student_id = ?').run(s.id);
    db.prepare('DELETE FROM group_members WHERE student_id = ?').run(s.id);
    db.prepare('DELETE FROM xp_log WHERE student_id = ?').run(s.id);
    db.prepare('DELETE FROM student_badges WHERE student_id = ?').run(s.id);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(s.id);
    db.prepare('DELETE FROM activity_logs WHERE user_id = ?').run(s.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(s.id);
    console.log(`  🗑️  ลบแล้ว: ${s.username} - ${s.name}`);
  });
  console.log(`\n✅ ลบเสร็จแล้ว!`);
} else {
  console.log('ไม่มีนักเรียนที่ต้องลบ');
}

const remaining = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'student'").get();
console.log(`\n📊 นักเรียนที่เหลือในระบบ: ${remaining.cnt} คน`);

db.close();
