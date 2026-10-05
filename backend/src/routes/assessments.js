import express from 'express';
import db from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, requireRole('teacher'));

// ─── Rubric Structure & Descriptions ──────────────────────────────────────────
export const RUBRIC_STRUCTURE = {
  title: 'แบบประเมินทักษะการปฏิบัติงาน รายวิชาโปรแกรมนำเสนอ สำหรับนักเรียนระดับประกาศนียบัตรวิชาชีพชั้นปีที่ 1',
  project: 'การจัดการเรียนรู้โดยใช้รูปแบบ Challenge-Based Learning เพื่อส่งเสริมทักษะการปฏิบัติงาน รายวิชาโปรแกรมนำเสนอ สำหรับนักเรียนระดับประกาศนียบัตรวิชาชีพชั้นปีที่ 1',
  author: 'นางสาวศิริประภา สมบัติคำ',
  advisor: 'นางสาวสายใจ พานิชกุล',
  maxScore: 105,
  levels: [
    { score: 5, label: 'ดีเยี่ยม', description: 'ปฏิบัติงานได้ถูกต้อง ครบถ้วน คล่องแคล่ว และสามารถดำเนินงานโดยใช้ Canva ได้ด้วยตนเองอย่างมีประสิทธิภาพ' },
    { score: 4, label: 'ดีมาก', description: 'ปฏิบัติงานได้ถูกต้องและครบถ้วนเป็นส่วนใหญ่ มีข้อผิดพลาดเล็กน้อย และสามารถแก้ไขได้ด้วยตนเอง' },
    { score: 3, label: 'ปานกลาง', description: 'ปฏิบัติงานได้ตามขั้นตอนในระดับหนึ่ง มีข้อผิดพลาดบางส่วน และสามารถปฏิบัติงานได้เมื่อได้รับคำแนะนำจากผู้สอน' },
    { score: 2, label: 'พอใช้', description: 'ปฏิบัติงานได้บางส่วน แต่มีข้อผิดพลาดหลายประการ และต้องได้รับคำแนะนำหรือความช่วยเหลือจากผู้สอนเป็นระยะ' },
    { score: 1, label: 'ปรับปรุง', description: 'ไม่สามารถปฏิบัติงานได้ถูกต้องหรือไม่สามารถดำเนินงานโดยใช้ Canva ได้ด้วยตนเอง และต้องได้รับความช่วยเหลือจากผู้สอนอย่างใกล้ชิด' }
  ],
  categories: [
    {
      id: 1,
      name: 'ด้านการวางแผนการปฏิบัติงาน',
      items: [
        { id: '1.1', text: 'วิเคราะห์รายละเอียดโจทย์ของงานที่ได้รับมอบหมายได้' },
        { id: '1.2', text: 'เตรียมข้อมูล รูปภาพ และองค์ประกอบที่จำเป็นต่อการสร้างผลงานได้' },
        { id: '1.3', text: 'วางแผนลำดับขั้นตอนการทำงานได้อย่างเหมาะสม' },
        { id: '1.4', text: 'ปฏิบัติงานตามแผนและสามารถปรับแก้เมื่อพบปัญหาได้' }
      ]
    },
    {
      id: 2,
      name: 'ด้านการใช้งานโปรแกรม Canva',
      items: [
        { id: '2.1', text: 'เข้าใช้งาน Canva และเลือกประเภทงานออกแบบได้เหมาะสม' },
        { id: '2.2', text: 'เลือกใช้ Template หรือรูปแบบการออกแบบให้เหมาะสมกับงาน' },
        { id: '2.3', text: 'ใช้เครื่องมือและฟังก์ชันต่าง ๆ ของ Canva ได้ถูกต้อง' },
        { id: '2.4', text: 'เพิ่ม ลบ และจัดการหน้าหรือสไลด์ของงานได้' },
        { id: '2.5', text: 'บันทึกและจัดการไฟล์ผลงานใน Canva ได้อย่างถูกต้อง' }
      ]
    },
    {
      id: 3,
      name: 'ด้านการปฏิบัติงานและการจัดการข้อความบนผลงาน',
      items: [
        { id: '3.1', text: 'เพิ่มข้อความลงในผลงานได้ถูกต้อง' },
        { id: '3.2', text: 'จัดรูปแบบตัวอักษร และลักษณะตัวอักษรได้เหมาะสม' },
        { id: '3.3', text: 'จัดตำแหน่งและระยะห่างของข้อความได้เหมาะสม' },
        { id: '3.4', text: 'จัดลำดับความสำคัญของข้อความให้สื่อสารเนื้อหาได้ชัดเจน' },
        { id: '3.5', text: 'จัดการกล่องข้อความและองค์ประกอบต่าง ๆ ได้เหมาะสม' },
        { id: '3.6', text: 'สามารถแก้ไขข้อผิดพลาดระหว่างการปฏิบัติงานได้' }
      ]
    },
    {
      id: 4,
      name: 'ด้านคุณภาพและความสมบูรณ์ของผลงาน',
      items: [
        { id: '4.1', text: 'ผลงานมีความถูกต้องตามโจทย์และวัตถุประสงค์' },
        { id: '4.2', text: 'ผลงานมีองค์ประกอบครบถ้วนตามที่กำหนด' },
        { id: '4.3', text: 'การจัดวางข้อความ ภาพ และองค์ประกอบมีความเหมาะสม' },
        { id: '4.4', text: 'ผลงานมีความสวยงาม อ่านง่าย และสื่อสารเนื้อหาได้ชัดเจน' },
        { id: '4.5', text: 'ตรวจสอบและแก้ไขข้อผิดพลาดของผลงานก่อนส่งได้' },
        { id: '4.6', text: 'สามารถนำความรู้และทักษะการใช้งาน Canva มาประยุกต์ใช้ในการสร้างผลงานได้' }
      ]
    }
  ]
};

// คำนวณระดับคุณภาพตามคะแนนหรือร้อยละ
export function calculateQualityLevel(percentage) {
  if (percentage >= 80) return 'ดีเยี่ยม';
  if (percentage >= 70) return 'ดีมาก';
  if (percentage >= 60) return 'ปานกลาง';
  if (percentage >= 50) return 'พอใช้';
  return 'ปรับปรุง';
}

// ─── GET /api/assessments/rubric-definition ───────────────────────────────────
router.get('/rubric-definition', (req, res) => {
  res.json(RUBRIC_STRUCTURE);
});

// ─── BEHAVIOR ASSESSMENTS (แบบบันทึกพฤติกรรมการส่งงาน 3 ด้าน) ───────────────────

// GET /api/assessments/behavior
router.get('/behavior', (req, res) => {
  try {
    const challengeId = req.query.challengeId ? Number(req.query.challengeId) : null;
    const sessionName = req.query.sessionName || 'ทั่วไป';

    // 1. ดึงนักเรียนทั้งหมดในห้อง ปวช.1/1 (43 คน) เรียงตามรหัสนักเรียน
    const students = db.prepare(`
      SELECT 
        u.id, 
        u.name, 
        u.username as student_code,
        u.class_name
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.username ASC
    `).all();

    // 2. ดึงข้อมูลการประเมินที่บันทึกไว้ในตาราง behavior_assessments
    let recordedStmt;
    if (challengeId) {
      recordedStmt = db.prepare(`
        SELECT student_id, status, note, evaluated_at
        FROM behavior_assessments
        WHERE challenge_id = ?
      `);
    } else {
      recordedStmt = db.prepare(`
        SELECT student_id, status, note, evaluated_at
        FROM behavior_assessments
        WHERE session_name = ? AND challenge_id IS NULL
      `);
    }
    const recordedList = challengeId ? recordedStmt.all(challengeId) : recordedStmt.all(sessionName);
    const recordedMap = {};
    recordedList.forEach(r => { recordedMap[r.student_id] = r; });

    // 3. ถ้ามี challengeId ดึงข้อมูลการส่งงานจริงจากตาราง student_challenges
    let systemSubmissionMap = {};
    if (challengeId) {
      const submissions = db.prepare(`
        SELECT 
          sc.student_id, 
          sc.status as challenge_status,
          sc.submitted_at,
          sc.is_on_time,
          sub.submission_status,
          sub.file_name,
          sc.canva_link
        FROM student_challenges sc
        LEFT JOIN submissions sub ON sub.student_challenge_id = sc.id
        WHERE sc.challenge_id = ?
      `).all(challengeId);

      submissions.forEach(s => {
        let detected = 'missing';
        if (s.submitted_at) {
          detected = s.is_on_time === 1 || s.submission_status === 'on_time' ? 'on_time' : 'late';
        }
        systemSubmissionMap[s.student_id] = {
          ...s,
          detectedStatus: detected
        };
      });
    }

    // รวมข้อมูลส่งกลับให้นักเรียนแต่ละคน
    const result = students.map((stu, index) => {
      const rec = recordedMap[stu.id];
      const sys = systemSubmissionMap[stu.id];

      // สถานะปัจจุบัน: ถ้ามีที่ครูบันทึกแล้วให้ใช้ของครู ถ้ายังไม่มีเป็น null (ยังไม่ประเมิน)
      const currentStatus = rec ? rec.status : null;

      return {
        orderNum: index + 1,
        studentId: stu.id,
        studentCode: stu.student_code,
        name: stu.name,
        className: stu.class_name,
        status: currentStatus, // 'on_time' | 'late' | 'missing' | null
        isSaved: !!rec,
        evaluatedAt: rec?.evaluated_at || null,
        note: rec?.note || '',
        systemData: sys || null
      };
    });

    res.json({
      challengeId,
      sessionName,
      students: result,
      summary: {
        total: result.length,
        onTimeCount: result.filter(r => r.status === 'on_time').length,
        lateCount: result.filter(r => r.status === 'late').length,
        missingCount: result.filter(r => r.status === 'missing').length
      }
    });
  } catch (error) {
    console.error('Error fetching behavior assessments:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assessments/behavior/batch
router.post('/behavior/batch', (req, res) => {
  try {
    const { challengeId, sessionName = 'ทั่วไป', assessments } = req.body;
    if (!Array.isArray(assessments)) {
      return res.status(400).json({ error: 'assessments must be an array' });
    }

    const teacherId = req.user.id;
    const cid = challengeId ? Number(challengeId) : null;

    const upsertStmt = db.prepare(`
      INSERT INTO behavior_assessments (class_id, challenge_id, session_name, student_id, status, note, evaluated_by, evaluated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(class_id, challenge_id, session_name, student_id)
      DO UPDATE SET status = excluded.status, note = excluded.note, evaluated_by = excluded.evaluated_by, evaluated_at = CURRENT_TIMESTAMP
    `);

    const deleteStmt = cid 
      ? db.prepare(`DELETE FROM behavior_assessments WHERE challenge_id = ? AND student_id = ?`)
      : db.prepare(`DELETE FROM behavior_assessments WHERE session_name = ? AND challenge_id IS NULL AND student_id = ?`);

    db.exec('BEGIN TRANSACTION');
    for (const a of assessments) {
      if (a.studentId) {
        if (['on_time', 'late', 'missing'].includes(a.status)) {
          upsertStmt.run(cid, sessionName, a.studentId, a.status, a.note || null, teacherId);
        } else {
          // ถ้าสถานะเป็น null หรือล้างค่า ให้ลบแถวออกจากฐานข้อมูล
          deleteStmt.run(cid || sessionName, a.studentId);
        }
      }
    }
    db.exec('COMMIT');

    res.json({ success: true, count: assessments.length });
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch(_) {}
    console.error('Error saving behavior assessments:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assessments/behavior/clear
router.post('/behavior/clear', (req, res) => {
  try {
    const { challengeId, sessionName = 'ทั่วไป' } = req.body;
    const cid = challengeId ? Number(challengeId) : null;
    if (cid) {
      db.prepare('DELETE FROM behavior_assessments WHERE challenge_id = ?').run(cid);
    } else {
      db.prepare('DELETE FROM behavior_assessments WHERE session_name = ? AND challenge_id IS NULL').run(sessionName);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing behavior assessments:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assessments/behavior/auto-sync
router.post('/behavior/auto-sync', (req, res) => {
  try {
    const { challengeId } = req.body;
    if (!challengeId) return res.status(400).json({ error: 'challengeId is required' });

    const teacherId = req.user.id;
    const cid = Number(challengeId);

    // ดึงสถานะการส่งงานจริงของทุกคนในคลาสนั้น
    const students = db.prepare(`SELECT id FROM users WHERE role = 'student'`).all();
    const submissions = db.prepare(`
      SELECT sc.student_id, sc.submitted_at, sc.is_on_time, sub.submission_status
      FROM student_challenges sc
      LEFT JOIN submissions sub ON sub.student_challenge_id = sc.id
      WHERE sc.challenge_id = ?
    `).all(cid);

    const subMap = {};
    submissions.forEach(s => { subMap[s.student_id] = s; });

    const upsertStmt = db.prepare(`
      INSERT INTO behavior_assessments (class_id, challenge_id, session_name, student_id, status, note, evaluated_by, evaluated_at)
      VALUES (1, ?, 'กิจกรรม Challenge', ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(class_id, challenge_id, session_name, student_id)
      DO UPDATE SET status = excluded.status, evaluated_by = excluded.evaluated_by, evaluated_at = CURRENT_TIMESTAMP
    `);

    db.exec('BEGIN TRANSACTION');
    let syncedCount = 0;
    for (const s of students) {
      const sub = subMap[s.id];
      let status = 'missing';
      let note = 'ยังไม่ส่งงาน';
      if (sub && sub.submitted_at) {
        if (sub.is_on_time === 1 || sub.submission_status === 'on_time') {
          status = 'on_time';
          note = 'ส่งงานตรงเวลาตามกำหนด';
        } else {
          status = 'late';
          note = 'ส่งงานล่าช้ากว่ากำหนด';
        }
      }
      upsertStmt.run(cid, s.id, status, note, teacherId);
      syncedCount++;
    }
    db.exec('COMMIT');

    res.json({ success: true, syncedCount });
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch(_) {}
    console.error('Error auto-syncing behavior assessments:', error);
    res.status(500).json({ error: error.message });
  }
});


// ─── SKILL ASSESSMENTS (แบบประเมินทักษะการปฏิบัติงาน 4 ด้าน 21 ข้อ) ─────────────

// GET /api/assessments/skills
router.get('/skills', (req, res) => {
  try {
    const assessmentType = req.query.assessmentType || 'post'; // 'pre', 'post', 'during'
    const challengeId = req.query.challengeId ? Number(req.query.challengeId) : null;
    const roundTitle = req.query.roundTitle || (assessmentType === 'pre' ? 'ประเมินก่อนจัดการเรียนรู้' : 'ประเมินหลังจัดการเรียนรู้');

    // รายชื่อนักเรียน 43 คน
    const students = db.prepare(`
      SELECT u.id, u.name, u.username as student_code, u.class_name
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.username ASC
    `).all();

    // ดึงคะแนนประเมิน
    let assessStmt;
    if (challengeId) {
      assessStmt = db.prepare(`
        SELECT * FROM skill_assessments
        WHERE challenge_id = ? AND assessment_type = ?
      `);
    } else {
      assessStmt = db.prepare(`
        SELECT * FROM skill_assessments
        WHERE round_title = ? AND assessment_type = ? AND challenge_id IS NULL
      `);
    }
    const assessList = challengeId ? assessStmt.all(challengeId, assessmentType) : assessStmt.all(roundTitle, assessmentType);
    const assessMap = {};
    assessList.forEach(a => {
      try { a.scores = JSON.parse(a.scores_json); } catch(_) { a.scores = {}; }
      assessMap[a.student_id] = a;
    });

    const result = students.map((stu, index) => {
      const a = assessMap[stu.id];
      return {
        orderNum: index + 1,
        studentId: stu.id,
        studentCode: stu.student_code,
        name: stu.name,
        className: stu.class_name,
        isEvaluated: !!a,
        scores: a?.scores || {},
        totalScore: a?.total_score || 0,
        scorePercentage: a?.score_percentage || 0,
        qualityLevel: a?.quality_level || 'ยังไม่ประเมิน',
        comments: a?.comments || '',
        evaluatorName: a?.evaluator_name || 'นางสาวศิริประภา สมบัติคำ',
        evaluatedAt: a?.evaluated_at || null
      };
    });

    // คำนวณค่าเฉลี่ยของทั้งห้อง
    const evaluatedOnly = result.filter(r => r.isEvaluated);
    const avgScore = evaluatedOnly.length > 0 
      ? Number((evaluatedOnly.reduce((acc, cur) => acc + cur.totalScore, 0) / evaluatedOnly.length).toFixed(2))
      : 0;
    const avgPercent = evaluatedOnly.length > 0
      ? Number((evaluatedOnly.reduce((acc, cur) => acc + cur.scorePercentage, 0) / evaluatedOnly.length).toFixed(2))
      : 0;

    res.json({
      assessmentType,
      challengeId,
      roundTitle,
      students: result,
      summary: {
        totalStudents: result.length,
        evaluatedCount: evaluatedOnly.length,
        pendingCount: result.length - evaluatedOnly.length,
        avgScore,
        avgPercent,
        overallQuality: calculateQualityLevel(avgPercent),
        levelCounts: {
          'ดีเยี่ยม': evaluatedOnly.filter(r => r.qualityLevel === 'ดีเยี่ยม').length,
          'ดีมาก': evaluatedOnly.filter(r => r.qualityLevel === 'ดีมาก').length,
          'ปานกลาง': evaluatedOnly.filter(r => r.qualityLevel === 'ปานกลาง').length,
          'พอใช้': evaluatedOnly.filter(r => r.qualityLevel === 'พอใช้').length,
          'ปรับปรุง': evaluatedOnly.filter(r => r.qualityLevel === 'ปรับปรุง').length,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching skill assessments:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assessments/skills/student/:studentId
router.get('/skills/student/:studentId', (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    const assessmentType = req.query.assessmentType || 'post';
    const challengeId = req.query.challengeId ? Number(req.query.challengeId) : null;
    const roundTitle = req.query.roundTitle || (assessmentType === 'pre' ? 'ประเมินก่อนจัดการเรียนรู้' : 'ประเมินหลังจัดการเรียนรู้');

    const student = db.prepare(`SELECT id, name, username as student_code, class_name FROM users WHERE id = ?`).get(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    let assess;
    if (challengeId) {
      assess = db.prepare(`
        SELECT * FROM skill_assessments
        WHERE student_id = ? AND challenge_id = ? AND assessment_type = ?
      `).get(studentId, challengeId, assessmentType);
    } else {
      assess = db.prepare(`
        SELECT * FROM skill_assessments
        WHERE student_id = ? AND round_title = ? AND assessment_type = ? AND challenge_id IS NULL
      `).get(studentId, roundTitle, assessmentType);
    }

    if (assess) {
      try { assess.scores = JSON.parse(assess.scores_json); } catch(_) { assess.scores = {}; }
    }

    res.json({
      student,
      assessment: assess || null
    });
  } catch (error) {
    console.error('Error fetching student skill assessment:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assessments/skills
router.post('/skills', (req, res) => {
  try {
    const {
      studentId,
      challengeId = null,
      assessmentType = 'post',
      roundTitle = 'ประเมินหลังจัดการเรียนรู้',
      scores, // { "1.1": 5, "1.2": 4, ... }
      comments = '',
      evaluatorName = 'นางสาวศิริประภา สมบัติคำ'
    } = req.body;

    if (!studentId || !scores || typeof scores !== 'object') {
      return res.status(400).json({ error: 'studentId and valid scores object are required' });
    }

    const teacherId = req.user.id;
    const cid = challengeId ? Number(challengeId) : null;

    // คำนวณผลคะแนนรวม (มี 21 ข้อ เต็ม 105)
    let totalScore = 0;
    let itemCount = 0;
    RUBRIC_STRUCTURE.categories.forEach(cat => {
      cat.items.forEach(item => {
        const val = Number(scores[item.id]) || 0;
        totalScore += val;
        itemCount++;
      });
    });

    const maxScore = itemCount * 5; // 105
    const scorePercentage = Number(((totalScore / maxScore) * 100).toFixed(2));
    const qualityLevel = calculateQualityLevel(scorePercentage);
    const scoresJson = JSON.stringify(scores);

    const upsertStmt = db.prepare(`
      INSERT INTO skill_assessments (
        class_id, student_id, challenge_id, assessment_type, round_title,
        scores_json, total_score, score_percentage, quality_level,
        comments, evaluator_name, evaluated_by, evaluated_at
      ) VALUES (
        1, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, CURRENT_TIMESTAMP
      )
      ON CONFLICT(student_id, assessment_type, challenge_id, round_title)
      DO UPDATE SET
        scores_json = excluded.scores_json,
        total_score = excluded.total_score,
        score_percentage = excluded.score_percentage,
        quality_level = excluded.quality_level,
        comments = excluded.comments,
        evaluator_name = excluded.evaluator_name,
        evaluated_by = excluded.evaluated_by,
        evaluated_at = CURRENT_TIMESTAMP
    `);

    upsertStmt.run(
      studentId,
      cid,
      assessmentType,
      roundTitle,
      scoresJson,
      totalScore,
      scorePercentage,
      qualityLevel,
      comments,
      evaluatorName,
      teacherId
    );

    res.json({
      success: true,
      totalScore,
      maxScore,
      scorePercentage,
      qualityLevel
    });
  } catch (error) {
    console.error('Error saving skill assessment:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── CSV EXPORTS ─────────────────────────────────────────────────────────────

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// GET /api/assessments/export/behavior/csv
router.get('/export/behavior/csv', (req, res) => {
  try {
    const challengeId = req.query.challengeId ? Number(req.query.challengeId) : null;
    const sessionName = req.query.sessionName || 'ทั่วไป';

    const students = db.prepare(`
      SELECT u.id, u.name, u.username as student_code, u.class_name
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.username ASC
    `).all();

    let recordedMap = {};
    if (challengeId) {
      const records = db.prepare(`SELECT student_id, status, note, evaluated_at FROM behavior_assessments WHERE challenge_id = ?`).all(challengeId);
      records.forEach(r => { recordedMap[r.student_id] = r; });
    } else {
      const records = db.prepare(`SELECT student_id, status, note, evaluated_at FROM behavior_assessments WHERE session_name = ? AND challenge_id IS NULL`).all(sessionName);
      records.forEach(r => { recordedMap[r.student_id] = r; });
    }

    const headers = ['ลำดับ', 'รหัสนักเรียน', 'ชื่อ-สกุล', 'ชั้นเรียน', 'ส่งงานตรงเวลา', 'ส่งงานล่าช้า', 'ไม่ส่งงาน', 'สถานะสรุป', 'หมายเหตุ'];
    const rows = students.map((stu, i) => {
      const rec = recordedMap[stu.id];
      const status = rec?.status || 'missing';
      return [
        i + 1,
        stu.student_code,
        stu.name,
        stu.class_name || 'ปวช.1/1',
        status === 'on_time' ? '✓' : '',
        status === 'late' ? '✓' : '',
        status === 'missing' ? '✓' : '',
        status === 'on_time' ? 'ส่งตรงเวลา' : (status === 'late' ? 'ส่งล่าช้า' : 'ไม่ส่งงาน'),
        rec?.note || ''
      ].map(escapeCSV).join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="behavior_assessment.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assessments/export/skills/csv
router.get('/export/skills/csv', (req, res) => {
  try {
    const assessmentType = req.query.assessmentType || 'post';
    const challengeId = req.query.challengeId ? Number(req.query.challengeId) : null;
    const roundTitle = req.query.roundTitle || (assessmentType === 'pre' ? 'ประเมินก่อนจัดการเรียนรู้' : 'ประเมินหลังจัดการเรียนรู้');

    const students = db.prepare(`
      SELECT u.id, u.name, u.username as student_code, u.class_name
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.username ASC
    `).all();

    let records;
    if (challengeId) {
      records = db.prepare(`SELECT * FROM skill_assessments WHERE challenge_id = ? AND assessment_type = ?`).all(challengeId, assessmentType);
    } else {
      records = db.prepare(`SELECT * FROM skill_assessments WHERE round_title = ? AND assessment_type = ? AND challenge_id IS NULL`).all(roundTitle, assessmentType);
    }

    const assessMap = {};
    records.forEach(r => {
      try { r.scores = JSON.parse(r.scores_json); } catch(_) { r.scores = {}; }
      assessMap[r.student_id] = r;
    });

    // 21 items headers
    const itemIds = [];
    RUBRIC_STRUCTURE.categories.forEach(cat => {
      cat.items.forEach(it => itemIds.push(it.id));
    });

    const headers = ['ลำดับ', 'รหัสนักเรียน', 'ชื่อ-สกุล', ...itemIds, 'คะแนนรวม (105)', 'ร้อยละ (%)', 'ระดับคุณภาพ', 'ความคิดเห็น'];
    const rows = students.map((stu, i) => {
      const a = assessMap[stu.id];
      const scores = a?.scores || {};
      const itemScores = itemIds.map(id => scores[id] || '');
      return [
        i + 1,
        stu.student_code,
        stu.name,
        ...itemScores,
        a?.total_score || '',
        a?.score_percentage || '',
        a?.quality_level || 'ยังไม่ประเมิน',
        a?.comments || ''
      ].map(escapeCSV).join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="skills_assessment.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
