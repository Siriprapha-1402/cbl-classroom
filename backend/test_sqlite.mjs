// Test Node.js built-in SQLite (available since Node v22.5)
import { DatabaseSync } from 'node:sqlite';

try {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
  const insert = db.prepare('INSERT INTO test (name) VALUES (?)');
  insert.run('hello');
  const row = db.prepare('SELECT * FROM test').get();
  console.log('✅ node:sqlite works! Row:', JSON.stringify(row));
  db.close();
} catch (e) {
  console.error('❌ FAILED:', e.message);
  process.exit(1);
}
