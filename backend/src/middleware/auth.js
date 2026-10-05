import jwt from 'jsonwebtoken';
import db from '../db/db.js';

const JWT_SECRET = 'cbl_classroom_secret_2024';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'ไม่พบ Token กรุณาเข้าสู่ระบบ' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, username, role, student_id, class_name FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'ไม่พบผู้ใช้' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
    }
    next();
  };
}

export { JWT_SECRET };
