import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', '..', 'cbl_classroom.db');
const db = new DatabaseSync(DB_PATH);

// นักเรียนจาก Google Sheets
const students = [
  { student_id: '69219100001', name: 'นางสาวกฤษณาพร โพธิมี' },
  { student_id: '69219100002', name: 'นางสาวกุลนัดดา บุญคุง' },
  { student_id: '69219100003', name: 'นางสาวจันทร์จิรา จูเจ๊ก' },
  { student_id: '69219100004', name: 'นางสาวจิรภิญญา อินทร์ศรีวงษ์' },
  { student_id: '69219100005', name: 'นายจิรายุ สารวงษ์' },
  { student_id: '69219100006', name: 'นางสาวชัญญานุช เช้าโต' },
  { student_id: '69219100007', name: 'นางสาวณัฏฐธิดา นาคแก้ว' },
  { student_id: '69219100008', name: 'เด็กหญิงณัฐธิดา สิงห์ทอง' },
  { student_id: '69219100009', name: 'นายธนเดช ชัยสา' },
  { student_id: '69219100010', name: 'เด็กหญิงธัญญานุช รัสมี' },
  { student_id: '69219100011', name: 'นางสาวนพเกล้า ต๊ะปัญญา' },
  { student_id: '69219100012', name: 'นางสาวนิตยา กำเนิดชาติ' },
  { student_id: '69219100013', name: 'เด็กหญิงปวิชญา บัวไข' },
  { student_id: '69219100014', name: 'นางสาวพิชญาภา บุญยะวัฒน์' },
  { student_id: '69219100015', name: 'นางสาวภรนิพา อาจมุณี' },
  { student_id: '69219100016', name: 'เด็กหญิงภัทรมัย ขันแก้ว' },
  { student_id: '69219100017', name: 'นายรัชชานนท์ จันทร์เที่ยง' },
  { student_id: '69219100018', name: 'นายวรันธร หิรัญทัศน์' },
  { student_id: '69219100019', name: 'นายสิทธิกวิน เพชรคชสิทธิ์' },
  { student_id: '69219100020', name: 'เด็กหญิงอภิญญา แปรงกระโทก' },
  { student_id: '69219100021', name: 'นางสาวอริสรา สุราฤทธิ์' },
  { student_id: '69219100022', name: 'นายพชร พูนพิพัตร' },
  { student_id: '69219100023', name: 'เด็กหญิงกิตติยาภา เครือบนอก' },
  { student_id: '69219100024', name: 'นายคมกริช โพธิ์ศรี' },
  { student_id: '69219100025', name: 'นางสาวจินตนาพร วงษ์ขำ' },
  { student_id: '69219100026', name: 'นายจิรมังกร ยศกันโท' },
  { student_id: '69219100027', name: 'นางสาวชนัญชิดา ออมสิน' },
  { student_id: '69219100028', name: 'นางสาวณภัสสรณ์ อัครนันท์ธัญกูล' },
  { student_id: '69219100029', name: 'เด็กหญิงณัฐณชา ศรีวิรัตน์' },
  { student_id: '69219100030', name: 'นายณัฐพัชร์ ศรศักดิ์' },
  { student_id: '69219100031', name: 'นายธนินทร์ คุ้มภัย' },
  { student_id: '69219100032', name: 'นางสาวธัญพร สินเจริญ' },
  { student_id: '69219100033', name: 'นางสาวน้ำผึ้ง สายกลาง' },
  { student_id: '69219100034', name: 'นางสาวปริชาติ บัวบาล' },
  { student_id: '69219100035', name: 'นายพัสกร พิมพ์สุวรรณ์' },
  { student_id: '69219100036', name: 'นางสาวพิชามญชุ์ พรมพันใจ' },
  { student_id: '69219100037', name: 'เด็กหญิงภัทรธิดา พวงเนียม' },
  { student_id: '69219100038', name: 'นายยงยศ คงเนียม' },
  { student_id: '69219100039', name: 'เด็กหญิงวรัญญา กล่อมใจ' },
  { student_id: '69219100040', name: 'นางสาวศิริประภา ใจวัง' },
  { student_id: '69219100041', name: 'นางสาวสุธิดา จันทรา' },
  { student_id: '69219100042', name: 'เด็กหญิงอรณิชา ปัตตะโชติ' },
  { student_id: '69219100043', name: 'นางสาวอารยา ทาตะนาม' },
];

const CLASS_NAME = 'ปวช.1/1';

// หา class_id
const classRow = db.prepare('SELECT id FROM classes LIMIT 1').get();
if (!classRow) {
  console.error('❌ ไม่พบชั้นเรียนในฐานข้อมูล กรุณา seed ก่อน');
  process.exit(1);
}
const classId = classRow.id;

const insertUser = db.prepare(`
  INSERT INTO users (name, username, password_hash, role, student_id, class_name)
  VALUES (?, ?, ?, 'student', ?, ?)
`);
const insertEnroll = db.prepare('INSERT INTO class_enrollments (student_id, class_id) VALUES (?, ?)');
const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');

let added = 0, skipped = 0;

console.log('🌱 กำลัง import นักเรียนเข้าฐานข้อมูล...\n');

for (const s of students) {
  const username = s.student_id.trim();
  const password = s.student_id.trim(); // username = password = รหัสนักเรียน
  const name = s.name.trim();

  // เช็คว่ามีแล้วหรือยัง
  const existing = checkUser.get(username);
  if (existing) {
    console.log(`  ⚠️  ข้ามแล้ว (มีอยู่แล้ว): ${username} - ${name}`);
    skipped++;
    continue;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = insertUser.run(name, username, hash, username, CLASS_NAME);
  insertEnroll.run(result.lastInsertRowid, classId);
  console.log(`  ✅ เพิ่มแล้ว: ${username} - ${name}`);
  added++;
}

console.log(`
╔══════════════════════════════════════════════╗
║           Import สำเร็จ!                     ║
╠══════════════════════════════════════════════╣
║  เพิ่มใหม่:  ${String(added).padEnd(3)} คน                        ║
║  ข้ามแล้ว:   ${String(skipped).padEnd(3)} คน (มีอยู่แล้ว)          ║
╠══════════════════════════════════════════════╣
║  วิธีเข้าสู่ระบบ:                            ║
║  Username = รหัสนักเรียน (เช่น 69219100001) ║
║  Password = รหัสนักเรียน (เช่น 69219100001) ║
╚══════════════════════════════════════════════╝
`);

db.close();
