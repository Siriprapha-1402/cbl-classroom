import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeSchema } from './db/schema.js';

// Routes
import authRouter from './routes/auth.js';
import challengesRouter from './routes/challenges.js';
import missionsRouter from './routes/missions.js';
import submissionsRouter from './routes/submissions.js';
import gradingRouter from './routes/grading.js';
import reflectionsRouter from './routes/reflections.js';
import studentsRouter from './routes/students.js';
import groupsRouter from './routes/groups.js';
import analyticsRouter from './routes/analytics.js';
import gamificationRouter from './routes/gamification.js';
import notificationsRouter from './routes/notifications.js';
import exportRouter from './routes/export.js';
import assessmentsRouter from './routes/assessments.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

// ─── Initialize DB ─────────────────────────────────────────────────────────────
initializeSchema();

// ─── Health Check (public) ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/missions', missionsRouter);
app.use('/api', submissionsRouter);           // /api/challenges/:id/submit, /api/checklists/:id/toggle, /api/submissions/:id
app.use('/api/grade', gradingRouter);
app.use('/api/reflections', reflectionsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/export', exportRouter);
app.use('/api/assessments', assessmentsRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'ไฟล์ขนาดใหญ่เกินไป (สูงสุด 50MB)' });
  res.status(err.status || 500).json({ error: err.message || 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   CBL Challenge Classroom — Backend       ║
  ║   Server running on http://localhost:${PORT}  ║
  ╚═══════════════════════════════════════════╝

  📋 Accounts:
     Teacher:  Teacheradmin / teacheradmin101
     Student:  รหัสนักเรียน (69219100001 - 69219100043) / รหัสนักเรียน

  🔗 API Base: http://localhost:${PORT}/api
  `);
});
