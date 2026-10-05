import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', '..', 'cbl_classroom.db');
const db = new DatabaseSync(DB_PATH);

const NEW_USERNAME = 'Teacheradmin';
const NEW_PASSWORD = 'teacheradmin101';

const hash = bcrypt.hashSync(NEW_PASSWORD, 10);
const result = db.prepare(`UPDATE users SET username = ?, password_hash = ? WHERE role = 'teacher'`).run(NEW_USERNAME, hash);

if (result.changes > 0) {
  const t = db.prepare("SELECT name, username FROM users WHERE role = 'teacher'").get();
  console.log('✅ อัปเดตสำเร็จ!');
  console.log(`   ชื่อ:     ${t.name}`);
  console.log(`   Username: ${t.username}`);
  console.log(`   Password: ${NEW_PASSWORD}`);
} else {
  console.log('❌ ไม่พบบัญชีครู');
}
db.close();
