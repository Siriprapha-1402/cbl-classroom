import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', '..', 'cbl_classroom.db');
const db = new DatabaseSync(DB_PATH);

const CSV_PATH = 'C:/Users/user/.gemini/antigravity-ide/brain/63002490-4253-439f-8089-82d2ecc6d1c8/.system_generated/steps/213/content.md';
const raw = readFileSync(CSV_PATH, 'utf8');
const lines = raw.split(/\r?\n/).filter(l => l.includes(',') && !l.includes('รหัสประจำตัว'));

const sheetStudents = lines.map(l => {
  const parts = l.split(',');
  return { id: parts[0].trim(), name: parts[1].trim() };
});

console.log(`📋 อ่านรายชื่อจาก Google Sheet ได้: ${sheetStudents.length} คน`);

const classRow = db.prepare('SELECT id FROM classes LIMIT 1').get();
const classId = classRow ? classRow.id : 1;

const insertUser = db.prepare(`
  INSERT INTO users (name, username, password_hash, role, student_id, class_name)
  VALUES (?, ?, ?, 'student', ?, 'ปวช.1/1')
`);
const updateUser = db.prepare(`
  UPDATE users SET name = ?, student_id = ?, password_hash = ? WHERE id = ?
`);
const enrollStmt = db.prepare('INSERT INTO class_enrollments (student_id, class_id) VALUES (?, ?)');

let added = 0;
let updated = 0;

for (const s of sheetStudents) {
  const user = db.prepare('SELECT id, name, username FROM users WHERE username = ?').get(s.id);
  const hash = bcrypt.hashSync(s.id, 10); // รหัสผ่านคือรหัสนักเรียน

  if (!user) {
    const res = insertUser.run(s.name, s.id, hash, s.id);
    enrollStmt.run(res.lastInsertRowid, classId);
    added++;
  } else {
    updateUser.run(s.name, s.id, hash, user.id);
    const hasEnroll = db.prepare('SELECT id FROM class_enrollments WHERE student_id = ? AND class_id = ?').get(user.id, classId);
    if (!hasEnroll) {
      enrollStmt.run(user.id, classId);
    }
    updated++;
  }
}

// ลบผู้ใช้ student ที่ไม่อยู่ใน Google Sheet
const sheetIds = sheetStudents.map(s => s.id);
const allDbStudents = db.prepare("SELECT id, username, name FROM users WHERE role = 'student'").all();
let removed = 0;
for (const stu of allDbStudents) {
  if (!sheetIds.includes(stu.username)) {
    db.prepare('DELETE FROM class_enrollments WHERE student_id = ?').run(stu.id);
    db.prepare('DELETE FROM group_members WHERE student_id = ?').run(stu.id);
    db.prepare('DELETE FROM student_challenges WHERE student_id = ?').run(stu.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(stu.id);
    console.log(`  🗑️ ลบนักเรียนที่ไม่อยู่ในชีต: ${stu.username} - ${stu.name}`);
    removed++;
  }
}

console.log(`✅ เพิ่มใหม่: ${added} คน | อัปเดต/ยืนยันรหัสผ่าน: ${updated} คน | ลบออก: ${removed} คน`);
const total = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student'").get().c;
console.log(`📊 จำนวนนักเรียนในฐานข้อมูลทั้งหมด: ${total} คน`);

// Export to initialData.json
const tables = [
  'users','classes','class_enrollments','groups','group_members','badges',
  'challenges','missions','checklist_items','student_challenges','submissions',
  'checklist_completions','mission_progress','reflections','activity_logs',
  'student_badges','scores','feedback','research_assessments','research_skills'
];
const exportData = {};
for (const t of tables) {
  try {
    exportData[t] = db.prepare(`SELECT * FROM ${t}`).all();
  } catch(e) {
    exportData[t] = [];
  }
}

const initialDataPath = join(__dirname, '..', '..', '..', 'frontend', 'src', 'lib', 'initialData.json');
writeFileSync(initialDataPath, JSON.stringify(exportData, null, 2), 'utf8');
console.log(`💾 อัปเดตข้อมูล ${initialDataPath} เรียบร้อยแล้ว!`);

db.close();
