import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', '..', 'cbl_classroom.db');
const db = new DatabaseSync(DB_PATH);

export const students = [
  { student_id: '69219100001', name: 'นางสาวกฤษณาพร โพธิมี' },
  { student_id: '69219100002', name: 'นางสาวกุลนัดดา บุญคุง' },
  { student_id: '69219100003', name: 'นางสาวจันทร์จิรา จูเจ๊ก' },
  { student_id: '69219100004', name: 'นางสาวจิรภิญญา อินทร์ศรีวงษ์' },
  { student_id: '69219100005', name: 'นายจิรายุ สารวงษ์' },
  { student_id: '69219100006', name: 'นางสาวชัญญานุช เช้าโต' },
  { student_id: '69219100007', name: 'นางสาวณัฏฐธิดา นาคแก้ว' },
  { student_id: '69219100008', name: 'นางสาวณัฐธิดา สิงห์ทอง' },
  { student_id: '69219100009', name: 'นายธนเดช ชัยสา' },
  { student_id: '69219100010', name: 'นางสาวธัญญานุช รัสมี' },
  { student_id: '69219100011', name: 'นางสาวนพเกล้า ต๊ะปัญญา' },
  { student_id: '69219100012', name: 'นางสาวนิตยา กำเนิดชาติ' },
  { student_id: '69219100013', name: 'นางสาวปวิชญา บัวไข' },
  { student_id: '69219100014', name: 'นางสาวพิชญาภา บุญยะวัฒน์' },
  { student_id: '69219100015', name: 'นางสาวภรนิพา อาจมุณี' },
  { student_id: '69219100016', name: 'นางสาวภัทรมัย ขันแก้ว' },
  { student_id: '69219100017', name: 'นายรัชชานนท์ จันทร์เที่ยง' },
  { student_id: '69219100018', name: 'นายวรันธร หิรัญทัศน์' },
  { student_id: '69219100019', name: 'นายสิทธิกวิน เพชรคชสิทธิ์' },
  { student_id: '69219100020', name: 'นางสาวอภิญญา แปรงกระโทก' },
  { student_id: '69219100021', name: 'นางสาวอริสรา สุราฤทธิ์' },
  { student_id: '69219100022', name: 'นายพชร พูนพิพัตร' },
  { student_id: '69219100023', name: 'นางสาวกิตติยาภา เครือบนอก' },
  { student_id: '69219100024', name: 'นายคมกริช โพธิ์ศรี' },
  { student_id: '69219100025', name: 'นางสาวจินตนาพร วงษ์ขำ' },
  { student_id: '69219100026', name: 'นายจิรมังกร ยศกันโท' },
  { student_id: '69219100027', name: 'นางสาวชนัญชิดา ออมสิน' },
  { student_id: '69219100028', name: 'นางสาวณภัสสรณ์ อัครนันท์ธัญกูล' },
  { student_id: '69219100029', name: 'นางสาวณัฐณิชา ศรีวิรัตน์' },
  { student_id: '69219100030', name: 'นายณัฐพัชร์ ศรศักดิ์' },
  { student_id: '69219100032', name: 'นางสาวธัญพร สินเจริญ' },
  { student_id: '69219100034', name: 'นางสาวปริชาติ บัวบาล' },
  { student_id: '69219100035', name: 'นายพัสกร พิมพ์สุวรรณ์' },
  { student_id: '69219100036', name: 'นางสาวพิชามญชุ์ พรมพันใจ' },
  { student_id: '69219100038', name: 'นายยงยศ คงเนียม' },
  { student_id: '69219100039', name: 'นางสาววรัญญา กล่อมใจ' },
  { student_id: '69219100042', name: 'นางสาวอรณิชา ปัตตะโชติ' },
  { student_id: '69219100044', name: 'นายวรสรณ์ ทรงสีดา' },
];

const targetIds = students.map(s => s.student_id);

// 1. Delete students not in target list
const allStudents = db.prepare("SELECT id, name, username FROM users WHERE role = 'student'").all();
const toDelete = allStudents.filter(s => !targetIds.includes(s.username));

console.log(`📋 พบนักเรียนเดิม: ${allStudents.length} คน`);
console.log(`🗑️ นักเรียนที่จะลบออก (ไม่อยู่ใน Google Sheet): ${toDelete.length} คน`);

for (const s of toDelete) {
  const scIds = db.prepare('SELECT id FROM student_challenges WHERE student_id = ?').all(s.id).map(r => r.id);
  for (const scId of scIds) {
    db.prepare('DELETE FROM submissions WHERE student_challenge_id = ?').run(scId);
    db.prepare('DELETE FROM scores WHERE student_challenge_id = ?').run(scId);
    db.prepare('DELETE FROM feedback WHERE student_challenge_id = ?').run(scId);
    db.prepare('DELETE FROM reflections WHERE student_challenge_id = ?').run(scId);
    db.prepare('DELETE FROM mission_progress WHERE student_challenge_id = ?').run(scId);
    db.prepare('DELETE FROM checklist_completions WHERE student_challenge_id = ?').run(scId);
    db.prepare('DELETE FROM link_submissions WHERE student_challenge_id = ?').run(scId);
  }
  db.prepare('DELETE FROM challenge_activity WHERE student_id = ?').run(s.id);
  db.prepare('DELETE FROM student_challenges WHERE student_id = ?').run(s.id);
  db.prepare('DELETE FROM class_enrollments WHERE student_id = ?').run(s.id);
  db.prepare('DELETE FROM group_members WHERE student_id = ?').run(s.id);
  db.prepare('UPDATE groups SET leader_id = NULL WHERE leader_id = ?').run(s.id);
  db.prepare('DELETE FROM xp_log WHERE student_id = ?').run(s.id);
  db.prepare('DELETE FROM student_badges WHERE student_id = ?').run(s.id);
  db.prepare('DELETE FROM notifications WHERE user_id = ?').run(s.id);
  db.prepare('DELETE FROM activity_logs WHERE user_id = ?').run(s.id);
  db.prepare('DELETE FROM behavior_assessments WHERE student_id = ?').run(s.id);
  db.prepare('DELETE FROM skill_assessments WHERE student_id = ?').run(s.id);
  db.prepare('DELETE FROM quiz_submissions WHERE student_id = ?').run(s.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(s.id);
  console.log(`  🗑️ ลบ: ${s.username} - ${s.name}`);
}

// 2. Class ID
const classRow = db.prepare('SELECT id FROM classes LIMIT 1').get();
const classId = classRow ? classRow.id : 1;

// 3. Update existing names and insert new students
const checkUser = db.prepare('SELECT id, name FROM users WHERE username = ?');
const updateUser = db.prepare('UPDATE users SET name = ? WHERE username = ?');
const insertUser = db.prepare(`
  INSERT INTO users (name, username, password_hash, role, student_id, class_name)
  VALUES (?, ?, ?, 'student', ?, 'ปวช.1/1')
`);
const insertEnroll = db.prepare('INSERT INTO class_enrollments (student_id, class_id) VALUES (?, ?)');

let updatedNames = 0;
let insertedNew = 0;

for (const s of students) {
  const existing = checkUser.get(s.student_id);
  if (existing) {
    if (existing.name !== s.name) {
      updateUser.run(s.name, s.student_id);
      console.log(`  ✏️ อัปเดตชื่อ: ${s.student_id} (${existing.name} -> ${s.name})`);
      updatedNames++;
    }
  } else {
    const hash = bcrypt.hashSync(s.student_id, 10);
    const res = insertUser.run(s.name, s.student_id, hash, s.student_id);
    insertEnroll.run(res.lastInsertRowid, classId);
    console.log(`  ✨ เพิ่มนักเรียนใหม่: ${s.student_id} - ${s.name}`);
    insertedNew++;
  }
}

const finalStudents = db.prepare("SELECT id, username, name FROM users WHERE role = 'student' ORDER BY username ASC").all();
console.log(`\n========================================`);
console.log(`✅ ซิงค์เสร็จสมบูรณ์! จำนวนนักเรียนทั้งหมดในระบบ: ${finalStudents.length} คน (ตามชีต: ${students.length} คน)`);
console.log(`========================================`);

db.close();
