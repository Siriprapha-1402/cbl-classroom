import express from 'express';
import db from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { awardXP } from '../services/gamification.js';
import { POWERPOINT_QUIZ_QUESTIONS } from '../data/quizQuestions.js';

const router = express.Router();
router.use(authenticate);

// ─── 1. GET /api/quizzes/questions ──────────────────────────────────────────
// ดึงข้อสอบ 10 ข้อ (ถ้ายังไม่ส่ง จะไม่ส่งเฉลยไปเพื่อป้องกันการดูคำตอบก่อน)
router.get('/questions', (req, res) => {
  const safeQuestions = POWERPOINT_QUIZ_QUESTIONS.map(q => ({
    id: q.id,
    topic: q.topic,
    question: q.question,
    options: q.options
  }));
  res.json({ questions: safeQuestions, total: safeQuestions.length });
});

// ─── 2. GET /api/quizzes/my-results ─────────────────────────────────────────
// ดูผลการทดสอบของนักเรียนคนปัจจุบัน (Pre-test และ Post-test)
router.get('/my-results', (req, res) => {
  const studentId = req.user.id;
  const rows = db.prepare(`
    SELECT quiz_type, score, total_score, answers_json, submitted_at
    FROM quiz_submissions
    WHERE student_id = ?
  `).all(studentId);

  const results = { pre: null, post: null };
  rows.forEach(r => {
    let answers = {};
    try { answers = JSON.parse(r.answers_json); } catch (_) {}
    results[r.quiz_type] = {
      score: r.score,
      total_score: r.total_score,
      percentage: Math.round((r.score / r.total_score) * 100),
      submitted_at: r.submitted_at,
      answers
    };
  });

  // แนบคำถามพร้อมเฉลยสำหรับตรวจสอบผลการทำข้อสอบ
  res.json({
    results,
    questionsWithAnswers: POWERPOINT_QUIZ_QUESTIONS
  });
});

// ─── 3. POST /api/quizzes/submit ────────────────────────────────────────────
// ส่งคำตอบแบบทดสอบก่อนเรียนหรือหลังเรียน
router.post('/submit', (req, res) => {
  const studentId = req.user.id;
  const { quizType, answers = {} } = req.body;

  if (!['pre', 'post'].includes(quizType)) {
    return res.status(400).json({ error: 'ประเภทแบบทดสอบไม่ถูกต้อง (ต้องเป็น pre หรือ post)' });
  }

  // คำนวณคะแนน
  let score = 0;
  const total = POWERPOINT_QUIZ_QUESTIONS.length;
  const details = [];

  POWERPOINT_QUIZ_QUESTIONS.forEach(q => {
    const studentChoice = answers[q.id] !== undefined ? Number(answers[q.id]) : null;
    const isCorrect = studentChoice === q.correctAnswer;
    if (isCorrect) score += 1;

    details.push({
      questionId: q.id,
      topic: q.topic,
      studentChoice,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation
    });
  });

  const answersJson = JSON.stringify(answers);

  // บันทึกคะแนนลงใน quiz_submissions (แทนที่หากทำซ้ำ)
  db.prepare(`
    INSERT INTO quiz_submissions (student_id, quiz_type, score, total_score, answers_json, submitted_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id, quiz_type) DO UPDATE SET
      score = excluded.score,
      total_score = excluded.total_score,
      answers_json = excluded.answers_json,
      submitted_at = CURRENT_TIMESTAMP
  `).run(studentId, quizType, score, total, answersJson);

  // ให้รางวัล XP (Pre-test: 20 XP, Post-test: 30 XP)
  try {
    const xpReward = quizType === 'pre' ? 20 : 30;
    const reason = quizType === 'pre' ? 'ทำแบบทดสอบก่อนเรียน (Pre-test)' : 'ทำแบบทดสอบหลังเรียน (Post-test)';
    awardXP(studentId, xpReward, reason);
  } catch (err) {
    console.error('Error awarding XP for quiz:', err);
  }

  res.json({
    success: true,
    quizType,
    score,
    total_score: total,
    percentage: Math.round((score / total) * 100),
    details,
    message: `ส่งแบบทดสอบ${quizType === 'pre' ? 'ก่อนเรียน' : 'หลังเรียน'}เรียบร้อยแล้ว!`
  });
});

// ─── 4. GET /api/quizzes/class-results ──────────────────────────────────────
// สำหรับครู: ดูคะแนนก่อนเรียนและหลังเรียนของนักเรียนทั้งห้อง
router.get('/class-results', (req, res) => {
  const students = db.prepare(`
    SELECT u.id, u.name, u.username, u.student_id, g.name as group_name
    FROM users u
    JOIN class_enrollments ce ON ce.student_id = u.id
    LEFT JOIN group_members gm ON gm.student_id = u.id
    LEFT JOIN groups g ON g.id = gm.group_id
    WHERE u.role = 'student'
    ORDER BY u.username ASC
  `).all();

  const submissions = db.prepare(`
    SELECT student_id, quiz_type, score, total_score, submitted_at
    FROM quiz_submissions
  `).all();

  const summary = students.map((s, idx) => {
    const pre = submissions.find(sub => sub.student_id === s.id && sub.quiz_type === 'pre');
    const post = submissions.find(sub => sub.student_id === s.id && sub.quiz_type === 'post');
    const gain = (post && pre) ? post.score - pre.score : null;

    return {
      orderNum: idx + 1,
      id: s.id,
      name: s.name,
      username: s.username,
      student_code: s.student_id || s.username,
      group_name: s.group_name || '-',
      preScore: pre ? pre.score : null,
      postScore: post ? post.score : null,
      gain,
      preSubmittedAt: pre?.submitted_at || null,
      postSubmittedAt: post?.submitted_at || null
    };
  });

  const totalPre = summary.filter(s => s.preScore !== null).length;
  const totalPost = summary.filter(s => s.postScore !== null).length;
  const avgPre = totalPre > 0 ? (summary.reduce((acc, s) => acc + (s.preScore || 0), 0) / totalPre).toFixed(2) : 0;
  const avgPost = totalPost > 0 ? (summary.reduce((acc, s) => acc + (s.postScore || 0), 0) / totalPost).toFixed(2) : 0;

  res.json({
    summary,
    stats: {
      totalStudents: students.length,
      totalPre,
      totalPost,
      avgPre: Number(avgPre),
      avgPost: Number(avgPost),
      avgGain: (avgPost - avgPre).toFixed(2)
    }
  });
});

export default router;
