import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/db.js';
import { authenticate, JWT_SECRET } from '../middleware/auth.js';
import { logActivity } from '../services/gamification.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'กรุณากรอก Username และ Password' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'ไม่พบผู้ใช้งาน' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

  logActivity(user.id, 'LOGIN', 'user', user.id);

  res.json({
    token,
    user: { id: user.id, name: user.name, username: user.username, role: user.role, student_id: user.student_id, class_name: user.class_name }
  });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
