import initialData from './initialData.json';
import { POWERPOINT_QUIZ_QUESTIONS } from '../data/quizQuestions';

const STORAGE_KEY = 'cbl_mock_db_clean_v6';

// Rubric definition
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

function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-upgrade / sync to clean state if version < 7
      if (!parsed.version || parsed.version < 7) {
        parsed.version = 7;
        parsed.groups = (parsed.groups && parsed.groups.length > 0) ? parsed.groups : (initialData.groups || []);
        parsed.student_challenges = [];
        parsed.submissions = [];
        parsed.scores = [];
        parsed.feedback = [];
        parsed.reflections = [];
        parsed.mission_progress = [];
        parsed.checklist_completions = [];
        parsed.student_badges = [];
        parsed.activity_logs = [];
        saveStore(parsed);
      }
      // Auto-heal only if parsed.challenges is missing or not an array
      if (!Array.isArray(parsed.challenges)) {
        parsed.challenges = initialData.challenges || [];
        parsed.missions = (parsed.missions && parsed.missions.length > 0) ? parsed.missions : (initialData.missions || []);
        parsed.checklist_items = (parsed.checklist_items && parsed.checklist_items.length > 0) ? parsed.checklist_items : (initialData.checklist_items || []);
        saveStore(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse mock store from localStorage', e);
  }
  // Initialize with clean data from initialData.json
  const store = {
    version: 7,
    users: initialData.users || [],
    classes: initialData.classes || [],
    class_enrollments: initialData.class_enrollments || [],
    groups: initialData.groups || [],
    group_members: initialData.group_members || [],
    badges: initialData.badges || [],
    challenges: initialData.challenges || [],
    missions: initialData.missions || [],
    checklist_items: initialData.checklist_items || [],
    student_challenges: initialData.student_challenges || [],
    submissions: initialData.submissions || [],
    checklist_completions: initialData.checklist_completions || [],
    mission_progress: initialData.mission_progress || [],
    reflections: initialData.reflections || [],
    activity_logs: initialData.activity_logs || [],
    student_badges: initialData.student_badges || [],
    scores: initialData.scores || [],
    feedback: initialData.feedback || [],
    research_assessments: initialData.research_assessments || [],
    research_skills: initialData.research_skills || [],
    behavior_map: {},
    behavior_notes: {},
    skill_assessments: {},
    canva_links: {},
    group_canva_links: {},
    quiz_submissions: initialData.quiz_submissions || []
  };
  saveStore(store);
  return store;
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cbl_storage_update'));
      try {
        const bc = new BroadcastChannel('cbl_channel');
        bc.postMessage({ type: 'UPDATED' });
        bc.close();
      } catch (e) {}
    }
  } catch (e) {
    console.warn('Failed to save mock store to localStorage', e);
  }
}

function getUserLevel(xp) {
  if (xp >= 1500) return { level: 5, nameTh: 'Challenge Master', nameEn: 'Challenge Master', minXp: 1500, maxXp: 99999 };
  if (xp >= 800)  return { level: 4, nameTh: 'Problem Solver',   nameEn: 'Problem Solver',   minXp: 800,  maxXp: 1499 };
  if (xp >= 400)  return { level: 3, nameTh: 'Creator',          nameEn: 'Creator',          minXp: 400,  maxXp: 799 };
  if (xp >= 150)  return { level: 2, nameTh: 'Explorer',         nameEn: 'Explorer',         minXp: 150,  maxXp: 399 };
  return { level: 1, nameTh: 'Beginner', nameEn: 'Beginner', minXp: 0, maxXp: 149 };
}

let currentConfig = null;

function getCurrentUser(store, config) {
  const cfg = config || currentConfig;
  const authHeader = cfg?.headers?.Authorization || cfg?.headers?.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token.startsWith('mock-token-teacher')) {
      const teacher = (store.users || []).find(u => u.role === 'teacher') || {
        id: 1, name: 'ศิริประภา สมบัติคำ', username: 'Teacheradmin', role: 'teacher'
      };
      return teacher;
    }
    if (token.startsWith('mock-token-student-')) {
      const match = token.match(/^mock-token-student-(\d+)/);
      if (match) {
        const sId = Number(match[1]);
        const student = (store.users || []).find(u => u.id === sId);
        if (student) return student;
      }
    }
    // Attempt decoding JWT payload
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadStr = decodeURIComponent(escape(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))));
        const payload = JSON.parse(payloadStr);
        if (payload?.id || payload?.username) {
          const matched = (store.users || []).find(u => 
            (payload.id && u.id === payload.id) || 
            (payload.username && (u.username === payload.username || u.student_id === payload.username))
          );
          if (matched) return matched;
          return payload;
        }
      }
    } catch (e) {}
  }

  // Check sessionStorage (isolated per tab)
  try {
    const sessionRaw = sessionStorage.getItem('cbl_user');
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      const matched = (store.users || []).find(u => 
        u.id === parsed.id || 
        u.username === parsed.username || 
        (parsed.student_id && (u.student_id === parsed.student_id || u.username === parsed.student_id))
      );
      if (matched) return matched;
      return parsed;
    }
  } catch (e) {}

  // Check localStorage (cross-tab fallback)
  try {
    const raw = localStorage.getItem('cbl_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      const matched = (store.users || []).find(u => 
        u.id === parsed.id || 
        u.username === parsed.username || 
        (parsed.student_id && (u.student_id === parsed.student_id || u.username === parsed.student_id))
      );
      if (matched) return matched;
      return parsed;
    }
  } catch (e) {}

  return null;
}

export async function handleMockRequest(config) {
  currentConfig = config;
  const store = getStore();
  const url = (config.url || '').replace(/^[a-z]+:\/\/[^/]+/i, '').replace(/^\/api/, '');
  const method = (config.method || 'get').toLowerCase();
  let body = {};
  if (typeof config.data === 'string') {
    try { body = JSON.parse(config.data); } catch (e) { body = {}; }
  } else if (config.data) {
    body = config.data;
  }
  const params = config.params || {};

  console.log(`[MockAPI] ${method.toUpperCase()} ${url}`, { body, params });

  // 1. Auth Login
  if (url === '/auth/login' && method === 'post') {
    const username = (body.username || '').trim();
    const password = (body.password || '').trim();

    // Teacher check
    if (username.toLowerCase() === 'teacheradmin' || username === 'admin') {
      if (password === 'teacheradmin101' || password.toLowerCase() === 'teacheradmin' || password === 'admin') {
        const teacher = store.users.find(u => u.role === 'teacher') || {
          id: 1, name: 'ศิริประภา สมบัติคำ', username: 'Teacheradmin', role: 'teacher'
        };
        const token = 'mock-token-teacher-' + Date.now();
        return {
          status: 200,
          data: {
            token,
            user: { id: teacher.id, name: teacher.name, username: teacher.username, role: 'teacher' }
          }
        };
      } else {
        const err = new Error('รหัสผ่านไม่ถูกต้อง');
        err.response = { status: 401, data: { error: 'รหัสผ่านไม่ถูกต้อง' } };
        throw err;
      }
    }

    // Student check (43 students from Google Sheet)
    const student = store.users.find(u => u.role === 'student' && (u.username === username || u.student_id === username));
    if (student) {
      // รหัสผ่านเข้าระบบของนักเรียนคือรหัสนักเรียน 11 หลัก
      if (password === student.username || password === student.student_id) {
        const token = 'mock-token-student-' + student.id + '-' + Date.now();
        return {
          status: 200,
          data: {
            token,
            user: {
              id: student.id,
              name: student.name,
              username: student.username,
              role: 'student',
              student_id: student.student_id,
              class_name: student.class_name || 'ปวช.1/1'
            }
          }
        };
      } else {
        const err = new Error('รหัสผ่านไม่ถูกต้อง');
        err.response = { status: 401, data: { error: 'รหัสผ่านไม่ถูกต้อง' } };
        throw err;
      }
    }

    const err = new Error('ไม่พบผู้ใช้งาน');
    err.response = { status: 401, data: { error: 'ไม่พบชื่อผู้ใช้ในระบบ' } };
    throw err;
  }

  // 2. Auth me
  if (url === '/auth/me' && method === 'get') {
    const user = getCurrentUser(store);
    return { status: 200, data: { user } };
  }

  // 3. Challenges - GET
  if (url === '/challenges' && method === 'get') {
    const currentUser = getCurrentUser(store, config);
    if (currentUser?.role === 'teacher') {
      const challenges = (store.challenges || []).map(c => {
        const scs = (store.student_challenges || []).filter(sc => sc.challenge_id === c.id);
        const submitted_count = scs.filter(sc => sc.status === 'submitted' || sc.status === 'graded').length;
        const on_time_count = scs.filter(sc => sc.is_on_time === 1 || (sc.status === 'submitted' && !sc.is_late)).length;
        const total_students = (store.users || []).filter(u => u.role === 'student').length;
        const mission_count = (store.missions || []).filter(m => m.challenge_id === c.id).length;
        return { ...c, submitted_count, on_time_count, total_students, mission_count };
      });
      return { status: 200, data: { challenges } };
    } else {
      // Student view - connected directly with teacher challenges
      const studentId = currentUser?.id;
      const challenges = (store.challenges || []).filter(c => c.status !== 'archived').map(c => {
        const sc = studentId ? (store.student_challenges || []).find(s => s.challenge_id === c.id && s.student_id === studentId) : null;
        return {
          ...c,
          my_status: sc ? sc.status : null,
          student_challenge_id: sc ? sc.id : null,
          started_at: sc?.started_at || null,
          submitted_at: sc?.submitted_at || null,
          is_on_time: sc?.is_on_time ?? 1,
          canva_link: sc?.canva_link || null,
          score: sc?.score ?? null,
          feedback_comment: sc?.feedback_comment || null
        };
      });
      return { status: 200, data: { challenges } };
    }
  }

  // Challenges - Create
  if (url === '/challenges' && method === 'post') {
    const newId = store.challenges.length ? Math.max(...store.challenges.map(c => c.id)) + 1 : 1;
    const newChallenge = {
      id: newId,
      class_id: 1,
      teacher_id: 1,
      title: body.title,
      description: body.description || '',
      scenario: body.scenario || '',
      goals: body.goals || '',
      deliverables: body.deliverables || '',
      duration_minutes: Number(body.duration_minutes) || 30,
      start_date: body.start_date || new Date().toISOString(),
      deadline: body.deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      max_score: Number(body.max_score) || 100,
      rubric: body.rubric || '',
      difficulty: body.difficulty || 'medium',
      group_size: Number(body.group_size) || 1,
      status: body.status || 'active', // เผยแพร่ทันทีเพื่อให้นักเรียนมองเห็น
      created_at: new Date().toISOString()
    };
    store.challenges.unshift(newChallenge);

    // Save missions
    if (Array.isArray(body.missions)) {
      body.missions.forEach((m, idx) => {
        store.missions.push({
          id: Date.now() + idx,
          challenge_id: newId,
          order_num: idx + 1,
          title: m.title || m,
          description: m.description || '',
          xp_reward: m.xp_reward || 10
        });
      });
    }

    // Save checklist
    if (Array.isArray(body.checklistItems)) {
      body.checklistItems.forEach((c, idx) => {
        store.checklist_items.push({
          id: Date.now() + idx + 100,
          challenge_id: newId,
          item_text: typeof c === 'string' ? c : c.item_text,
          order_num: idx + 1
        });
      });
    }

    saveStore(store);
    return { status: 201, data: { challenge: newChallenge, challengeId: newId, id: newId } };
  }

  // Publish challenge
  const pubMatch = url.match(/^\/challenges\/(\d+)\/publish$/);
  if (pubMatch && method === 'post') {
    const cid = Number(pubMatch[1]);
    const c = store.challenges.find(ch => ch.id === cid);
    if (c) c.status = 'active';
    saveStore(store);
    return { status: 200, data: { ok: true, status: 'active', challenge: c } };
  }

  // Challenge detail / delete
  const chalDetailMatch = url.match(/^\/challenges\/(\d+)$/);
  if (chalDetailMatch) {
    const cid = Number(chalDetailMatch[1]);
    if (method === 'get') {
      const challenge = store.challenges.find(c => c.id === cid);
      if (!challenge) {
        const err = new Error('ไม่พบ Challenge');
        err.response = { status: 404, data: { error: 'ไม่พบ Challenge' } };
        throw err;
      }
      const missions = store.missions.filter(m => m.challenge_id === cid);
      const checklistItems = store.checklist_items.filter(cl => cl.challenge_id === cid);
      const currentUser = getCurrentUser(store, config);
      let studentProgress = null;
      if (currentUser?.id) {
        let sc = store.student_challenges.find(s => s.challenge_id === cid && s.student_id === currentUser.id);
        if (sc) {
          const missionProgress = store.mission_progress.filter(mp => mp.student_challenge_id === sc.id);
          const checklistCompletions = store.checklist_completions.filter(cc => cc.student_challenge_id === sc.id);
          studentProgress = { ...sc, missionProgress, checklistCompletions };
        }
      }
      return { status: 200, data: { challenge, missions, checklistItems, studentProgress } };
    }
    if (method === 'put') {
      const c = (store.challenges || []).find(ch => ch.id === cid);
      if (!c) {
        const err = new Error('ไม่พบ Challenge');
        err.response = { status: 404, data: { error: 'ไม่พบ Challenge' } };
        throw err;
      }
      if (body.title) c.title = body.title.trim();
      if (body.description !== undefined) c.description = body.description;
      if (body.scenario !== undefined) c.scenario = body.scenario;
      if (body.goals !== undefined) c.goals = body.goals;
      if (body.deliverables !== undefined) c.deliverables = body.deliverables;
      if (body.deadline !== undefined) c.deadline = body.deadline;
      if (body.max_score !== undefined) c.max_score = Number(body.max_score) || 100;
      if (body.difficulty !== undefined) c.difficulty = body.difficulty;
      if (body.status !== undefined) c.status = body.status;
      else c.status = 'active';

      // Update missions
      if (Array.isArray(body.missions)) {
        store.missions = (store.missions || []).filter(m => m.challenge_id !== cid);
        body.missions.forEach((m, idx) => {
          store.missions.push({
            id: m.id || (Date.now() + idx),
            challenge_id: cid,
            order_num: idx + 1,
            title: m.title || m,
            description: m.description || '',
            xp_reward: m.xp_reward || 10
          });
        });
      }

      // Update checklist
      if (Array.isArray(body.checklistItems)) {
        store.checklist_items = (store.checklist_items || []).filter(cl => cl.challenge_id !== cid);
        body.checklistItems.forEach((item, idx) => {
          store.checklist_items.push({
            id: (typeof item === 'object' && item.id) ? item.id : (Date.now() + idx + 100),
            challenge_id: cid,
            item_text: typeof item === 'string' ? item : (item.item_text || ''),
            order_num: idx + 1
          });
        });
      }

      saveStore(store);
      return { status: 200, data: { message: 'อัปเดตกิจกรรมสำเร็จ', challenge: c, challengeId: c.id } };
    }
    if (method === 'delete') {
      store.challenges = (store.challenges || []).filter(c => c.id !== cid);
      store.missions = (store.missions || []).filter(m => m.challenge_id !== cid);
      store.checklist_items = (store.checklist_items || []).filter(cl => cl.challenge_id !== cid);

      // ลบข้อมูลความคืบหน้าของนักเรียนที่ผูกกับกิจกรรมนี้
      const scIds = (store.student_challenges || []).filter(sc => sc.challenge_id === cid).map(sc => sc.id);
      store.student_challenges = (store.student_challenges || []).filter(sc => sc.challenge_id !== cid);
      store.submissions = (store.submissions || []).filter(sub => !scIds.includes(sub.student_challenge_id));
      store.mission_progress = (store.mission_progress || []).filter(mp => !scIds.includes(mp.student_challenge_id));
      store.checklist_completions = (store.checklist_completions || []).filter(cc => !scIds.includes(cc.student_challenge_id));

      // ลบลิงก์ Canva ของกลุ่มที่ผูกกับกิจกรรมนี้
      if (store.group_canva_links) {
        Object.keys(store.group_canva_links).forEach(k => {
          if (k.startsWith(`${cid}_`)) {
            delete store.group_canva_links[k];
          }
        });
      }
      if (store.canva_links) {
        delete store.canva_links[cid];
      }

      saveStore(store);
      return { status: 200, data: { ok: true, message: 'ลบกิจกรรมสำเร็จ' } };
    }
  }

  // Start challenge (Student starts task)
  const startMatch = url.match(/^\/challenges\/(\d+)\/start$/);
  if (startMatch && method === 'post') {
    const cid = Number(startMatch[1]);
    const user = getCurrentUser(store, config);
    const userId = user?.id || (store.users.find(u => u.role === 'student')?.id || 16);
    let sc = store.student_challenges.find(s => s.challenge_id === cid && s.student_id === userId);
    if (!sc) {
      sc = {
        id: Date.now(),
        student_id: userId,
        challenge_id: cid,
        status: 'in_progress',
        started_at: new Date().toISOString()
      };
      store.student_challenges.push(sc);
    } else {
      sc.status = 'in_progress';
      sc.started_at = sc.started_at || new Date().toISOString();
    }
    saveStore(store);
    return { status: 200, data: { message: 'เริ่ม Challenge สำเร็จ', studentChallengeId: sc.id } };
  }

  // Submit challenge link (Student submits Canva link)
  const submitLinkMatch = url.match(/^\/challenges\/(\d+)\/(submit-link|submit)$/);
  if (submitLinkMatch && method === 'post') {
    const cid = Number(submitLinkMatch[1]);
    const user = getCurrentUser(store, config);
    const userId = user?.id || (store.users.find(u => u.role === 'student')?.id || 16);
    let sc = store.student_challenges.find(s => s.challenge_id === cid && s.student_id === userId);
    if (!sc) {
      sc = {
        id: Date.now(),
        student_id: userId,
        challenge_id: cid,
        started_at: new Date().toISOString()
      };
      store.student_challenges.push(sc);
    }
    sc.status = 'submitted';
    sc.submitted_at = new Date().toISOString();
    sc.canva_link = (body.canvaLink || body.link || '').trim();
    sc.note = body.note || '';
    sc.is_on_time = 1;

    // บันทึกลิงก์ Canva ประจำกลุ่มของนักเรียนด้วย (เฉพาะกลุ่มนี้เท่านั้น)
    const myGrp = (store.groups || []).find(g => 
      g.members?.some(m => m.id === userId || m.student_code === user?.username || m.student_code === user?.student_id)
    );
    if (myGrp && sc.canva_link) {
      store.group_canva_links = store.group_canva_links || {};
      store.group_canva_links[`${cid}_${myGrp.id}`] = {
        challengeId: cid,
        groupId: myGrp.id,
        groupName: myGrp.name,
        link: sc.canva_link,
        setBy: userId,
        setByName: user?.name || 'สมาชิกในกลุ่ม',
        updatedAt: new Date().toISOString()
      };
    }

    store.submissions.push({
      id: Date.now(),
      student_challenge_id: sc.id,
      canva_link: sc.canva_link,
      submitted_at: sc.submitted_at,
      status: 'submitted'
    });

    saveStore(store);
    return { status: 200, data: { ok: true, studentChallenge: sc } };
  }

  // Teacher view submissions for challenge - connects all 43 students
  const subsMatch = url.match(/^\/challenges\/(\d+)\/submissions$/);
  if (subsMatch && method === 'get') {
    const cid = Number(subsMatch[1]);
    const students = (store.users || []).filter(u => u.role === 'student');
    const challenge = (store.challenges || []).find(c => c.id === cid);
    const submissions = students.map(u => {
      const sc = (store.student_challenges || []).find(s => s.challenge_id === cid && s.student_id === u.id);
      const myGrp = (store.groups || []).find(g => 
        g.members?.some(m => m.id === u.id || m.student_code === u.username || m.student_code === u.student_id)
      );
      const groupLink = myGrp ? (store.group_canva_links?.[`${cid}_${myGrp.id}`]?.link || '') : '';
      const finalCanvaLink = sc?.canva_link || groupLink || '';

      return {
        id: sc ? sc.id : null,
        student_challenge_id: sc ? sc.id : null,
        student_user_id: u.id,
        student_id: u.id,
        student_name: u.name,
        student_code: u.student_id || u.username,
        username: u.username,
        group_id: myGrp?.id || null,
        group_name: myGrp?.name || 'ยังไม่มีกลุ่ม',
        status: sc ? sc.status : 'not_started',
        started_at: sc?.started_at || null,
        submitted_at: sc?.submitted_at || null,
        score: sc?.score ?? null,
        max_score: challenge?.max_score || 100,
        canva_link: finalCanvaLink,
        total_missions: (store.missions || []).filter(m => m.challenge_id === cid).length,
        completed_missions: sc ? (store.mission_progress || []).filter(mp => mp.student_challenge_id === sc.id).length : 0,
        total_checklists: (store.checklist_items || []).filter(ci => ci.challenge_id === cid).length,
        completed_checklists: sc ? (store.checklist_completions || []).filter(cc => cc.student_challenge_id === sc.id).length : 0
      };
    });
    return { status: 200, data: { submissions } };
  }

  // 4. Missions progress
  const missionToggleMatch = url.match(/^\/missions\/(\d+)\/complete$/);
  if (missionToggleMatch && method === 'post') {
    const mid = Number(missionToggleMatch[1]);
    const user = getCurrentUser(store);
    const sc = store.student_challenges.find(s => s.student_id === user.id) || { id: 1 };
    store.mission_progress.push({
      id: Date.now(),
      student_challenge_id: sc.id,
      mission_id: mid,
      completed_at: new Date().toISOString()
    });
    saveStore(store);
    return { status: 200, data: { ok: true, completed: true } };
  }

  // 4. Missions progress - Teacher toggle & Batch
  if (url === '/missions/teacher/toggle' && method === 'post') {
    const { missionId, studentChallengeId, applyToGroup } = body;
    const targetSc = (store.student_challenges || []).find(s => s.id === Number(studentChallengeId));
    if (targetSc) {
      const studentIds = [targetSc.student_id];
      if (applyToGroup) {
        const grp = (store.groups || []).find(g => g.members?.some(m => m.id === targetSc.student_id));
        if (grp?.members) grp.members.forEach(m => { if (!studentIds.includes(m.id)) studentIds.push(m.id); });
      }
      store.mission_progress = store.mission_progress || [];
      studentIds.forEach(sid => {
        let sc = (store.student_challenges || []).find(s => s.challenge_id === targetSc.challenge_id && s.student_id === sid);
        if (!sc) {
          sc = { id: Date.now() + sid, challenge_id: targetSc.challenge_id, student_id: sid, status: 'in_progress', started_at: new Date().toISOString() };
          store.student_challenges.push(sc);
        }
        const existingIdx = store.mission_progress.findIndex(mp => mp.student_challenge_id === sc.id && mp.mission_id === Number(missionId));
        if (existingIdx >= 0) {
          store.mission_progress.splice(existingIdx, 1);
        } else {
          store.mission_progress.push({
            id: Date.now() + sid,
            student_challenge_id: sc.id,
            mission_id: Number(missionId),
            status: 'completed',
            completed_at: new Date().toISOString()
          });
        }
      });
      saveStore(store);
    }
    return { status: 200, data: { ok: true } };
  }

  if (url === '/missions/teacher/batch' && method === 'post') {
    const { checkAll, studentChallengeId, applyToGroup } = body;
    const targetSc = (store.student_challenges || []).find(s => s.id === Number(studentChallengeId));
    if (targetSc) {
      const studentIds = [targetSc.student_id];
      if (applyToGroup) {
        const grp = (store.groups || []).find(g => g.members?.some(m => m.id === targetSc.student_id));
        if (grp?.members) grp.members.forEach(m => { if (!studentIds.includes(m.id)) studentIds.push(m.id); });
      }
      const challengeMissions = (store.missions || []).filter(m => m.challenge_id === targetSc.challenge_id);
      store.mission_progress = store.mission_progress || [];
      studentIds.forEach(sid => {
        let sc = (store.student_challenges || []).find(s => s.challenge_id === targetSc.challenge_id && s.student_id === sid);
        if (!sc) {
          sc = { id: Date.now() + sid, challenge_id: targetSc.challenge_id, student_id: sid, status: 'in_progress', started_at: new Date().toISOString() };
          store.student_challenges.push(sc);
        }
        store.mission_progress = store.mission_progress.filter(mp => !(mp.student_challenge_id === sc.id && challengeMissions.some(m => m.id === mp.mission_id)));
        if (checkAll) {
          challengeMissions.forEach(m => {
            store.mission_progress.push({
              id: Date.now() + sid + m.id,
              student_challenge_id: sc.id,
              mission_id: m.id,
              status: 'completed',
              completed_at: new Date().toISOString()
            });
          });
        }
      });
      saveStore(store);
    }
    return { status: 200, data: { ok: true } };
  }

  // 5. Checklists toggle - Teacher toggle & Batch
  const clToggleMatch = url.match(/^\/checklists\/(\d+)\/toggle$/);
  if (clToggleMatch && method === 'post') {
    const clid = Number(clToggleMatch[1]);
    const user = getCurrentUser(store);
    const sc = store.student_challenges.find(s => s.student_id === user.id) || { id: 1 };
    store.checklist_completions = store.checklist_completions || [];
    const idx = store.checklist_completions.findIndex(c => c.checklist_item_id === clid && c.student_challenge_id === sc.id);
    if (idx >= 0) {
      store.checklist_completions.splice(idx, 1);
    } else {
      store.checklist_completions.push({
        id: Date.now(),
        checklist_item_id: clid,
        student_challenge_id: sc.id,
        checked: 1,
        completed_at: new Date().toISOString()
      });
    }
    saveStore(store);
    return { status: 200, data: { ok: true } };
  }

  if (url === '/checklists/teacher/toggle' && method === 'post') {
    const { itemId, studentChallengeId, applyToGroup } = body;
    const targetSc = (store.student_challenges || []).find(s => s.id === Number(studentChallengeId));
    if (targetSc) {
      const studentIds = [targetSc.student_id];
      if (applyToGroup) {
        const grp = (store.groups || []).find(g => g.members?.some(m => m.id === targetSc.student_id));
        if (grp?.members) grp.members.forEach(m => { if (!studentIds.includes(m.id)) studentIds.push(m.id); });
      }
      store.checklist_completions = store.checklist_completions || [];
      studentIds.forEach(sid => {
        let sc = (store.student_challenges || []).find(s => s.challenge_id === targetSc.challenge_id && s.student_id === sid);
        if (!sc) {
          sc = { id: Date.now() + sid, challenge_id: targetSc.challenge_id, student_id: sid, status: 'in_progress', started_at: new Date().toISOString() };
          store.student_challenges.push(sc);
        }
        const existingIdx = store.checklist_completions.findIndex(cc => cc.student_challenge_id === sc.id && cc.checklist_item_id === Number(itemId));
        if (existingIdx >= 0) {
          store.checklist_completions.splice(existingIdx, 1);
        } else {
          store.checklist_completions.push({
            id: Date.now() + sid,
            student_challenge_id: sc.id,
            checklist_item_id: Number(itemId),
            checked: 1,
            completed_at: new Date().toISOString()
          });
        }
      });
      saveStore(store);
    }
    return { status: 200, data: { ok: true } };
  }

  if (url === '/checklists/teacher/batch' && method === 'post') {
    const { checkAll, studentChallengeId, applyToGroup } = body;
    const targetSc = (store.student_challenges || []).find(s => s.id === Number(studentChallengeId));
    if (targetSc) {
      const studentIds = [targetSc.student_id];
      if (applyToGroup) {
        const grp = (store.groups || []).find(g => g.members?.some(m => m.id === targetSc.student_id));
        if (grp?.members) grp.members.forEach(m => { if (!studentIds.includes(m.id)) studentIds.push(m.id); });
      }
      const challengeChecklist = (store.checklist_items || []).filter(ci => ci.challenge_id === targetSc.challenge_id);
      store.checklist_completions = store.checklist_completions || [];
      studentIds.forEach(sid => {
        let sc = (store.student_challenges || []).find(s => s.challenge_id === targetSc.challenge_id && s.student_id === sid);
        if (!sc) {
          sc = { id: Date.now() + sid, challenge_id: targetSc.challenge_id, student_id: sid, status: 'in_progress', started_at: new Date().toISOString() };
          store.student_challenges.push(sc);
        }
        store.checklist_completions = store.checklist_completions.filter(cc => !(cc.student_challenge_id === sc.id && challengeChecklist.some(ci => ci.id === cc.checklist_item_id)));
        if (checkAll) {
          challengeChecklist.forEach(ci => {
            store.checklist_completions.push({
              id: Date.now() + sid + ci.id,
              student_challenge_id: sc.id,
              checklist_item_id: ci.id,
              checked: 1,
              completed_at: new Date().toISOString()
            });
          });
        }
      });
      saveStore(store);
    }
    return { status: 200, data: { ok: true } };
  }

  // 6. Grading - Teacher views & grades student
  const gradeInitMatch = url.match(/^\/grade\/init\/(\d+)\/(\d+)$/);
  if (gradeInitMatch && method === 'post') {
    const cid = Number(gradeInitMatch[1]);
    const sid = Number(gradeInitMatch[2]);
    let sc = (store.student_challenges || []).find(s => s.challenge_id === cid && s.student_id === sid);
    if (!sc) {
      sc = {
        id: Date.now(),
        challenge_id: cid,
        student_id: sid,
        status: 'in_progress',
        started_at: new Date().toISOString()
      };
      store.student_challenges.push(sc);
      saveStore(store);
    }
    return { status: 200, data: { studentChallengeId: sc.id } };
  }

  const gradeMatch = url.match(/^\/grade\/(\d+)$/);
  if (gradeMatch) {
    const scId = Number(gradeMatch[1]);
    let sc = (store.student_challenges || []).find(s => s.id === scId);
    const student = sc ? store.users.find(u => u.id === sc.student_id) : store.users[1];
    const challenge = sc ? store.challenges.find(ch => ch.id === sc.challenge_id) : store.challenges[0];
    const missions = (store.missions || []).filter(m => m.challenge_id === challenge?.id);
    const checklist = (store.checklist_items || []).filter(ci => ci.challenge_id === challenge?.id);

    if (method === 'get') {
      const mappedChecklist = checklist.map(ci => ({
        ...ci,
        checked: (store.checklist_completions || []).some(cc => cc.student_challenge_id === sc?.id && cc.checklist_item_id === ci.id && cc.checked) ? 1 : 0
      }));
      const mappedMissions = missions.map(m => ({
        ...m,
        progress_status: (store.mission_progress || []).some(mp => mp.student_challenge_id === sc?.id && mp.mission_id === m.id) ? 'completed' : 'in_progress'
      }));
      const grp = (store.groups || []).find(g => g.members?.some(m => m.id === student?.id || m.student_code === student?.username || m.student_code === student?.student_id));
      return {
        status: 200,
        data: {
          submission: {
            id: sc?.id,
            student_challenge_id: sc?.id,
            canva_link: sc?.canva_link || null,
            challenge_title: challenge?.title || 'Challenge',
            max_score: challenge?.max_score || 100,
            submitted_at: sc?.submitted_at || null,
            submission_status: sc?.status === 'submitted' || sc?.status === 'graded' ? 'on_time' : 'pending'
          },
          student: {
            id: student?.id,
            name: student?.name,
            username: student?.username,
            student_code: student?.student_id || student?.username,
            group_id: grp?.id || null,
            group_name: grp?.name || null
          },
          grade: sc?.score !== undefined && sc?.score !== null ? { score: sc.score, comment: sc.feedback_comment || '' } : null,
          checklist: mappedChecklist,
          missions: mappedMissions
        }
      };
    }
    if (method === 'post') {
      if (sc) {
        sc.score = Number(body.score);
        sc.status = 'graded';
        sc.feedback_comment = body.comment || '';
        sc.graded_at = new Date().toISOString();

        if (body.applyToGroup) {
          const grp = (store.groups || []).find(g => g.members?.some(m => m.id === sc.student_id));
          if (grp?.members) {
            grp.members.forEach(m => {
              if (m.id !== sc.student_id) {
                let msc = (store.student_challenges || []).find(s => s.challenge_id === sc.challenge_id && s.student_id === m.id);
                if (!msc) {
                  msc = {
                    id: Date.now() + m.id,
                    student_id: m.id,
                    challenge_id: sc.challenge_id,
                    status: 'graded',
                    started_at: sc.started_at || new Date().toISOString(),
                    submitted_at: sc.submitted_at || new Date().toISOString(),
                    canva_link: sc.canva_link || ''
                  };
                  store.student_challenges.push(msc);
                }
                msc.score = Number(body.score);
                msc.status = 'graded';
                msc.feedback_comment = body.comment || '';
                msc.graded_at = new Date().toISOString();
                if (sc.canva_link && !msc.canva_link) msc.canva_link = sc.canva_link;
              }
            });
          }
        }
        saveStore(store);
      }
      return { status: 200, data: { ok: true, message: 'บันทึกคะแนนและ Feedback เรียบร้อย' } };
    }
  }

  // 7. Students List for Teacher (All 43 students from Google Sheet in order)
  if (url === '/students' && method === 'get') {
    const students = store.users
      .filter(u => u.role === 'student')
      .map((s, idx) => {
        const scs = (store.student_challenges || []).filter(sc => sc.student_id === s.id);
        const completed_count = scs.filter(sc => sc.status === 'submitted' || sc.status === 'graded').length;
        const on_time_count = scs.filter(sc => sc.is_on_time === 1).length;
        const xp = scs.reduce((acc, sc) => acc + (sc.score || 0), 0);
        const lvl = getUserLevel(xp);

        // Find group
        let group_name = '-';
        if (store.groups && Array.isArray(store.groups)) {
          const g = store.groups.find(grp => grp.members && grp.members.some(m => m.id === s.id || m.student_code === s.username || m.student_code === s.student_id));
          if (g) group_name = g.name;
        }

        return {
          id: s.id,
          name: s.name,
          username: s.username,
          student_code: s.student_id || s.username,
          class_name: s.class_name || 'ปวช.1/1',
          orderNum: idx + 1,
          completed_count,
          submitted_count: completed_count,
          on_time_count,
          onTimeRate: completed_count > 0 ? Math.round((on_time_count / completed_count) * 100) : 0,
          xp,
          level: lvl.level,
          levelName: lvl.nameTh,
          group_name
        };
      });
    return { status: 200, data: { students } };
  }

  const stuDetailMatch = url.match(/^\/students\/(\d+)$/);
  if (stuDetailMatch && method === 'get') {
    const sid = Number(stuDetailMatch[1]);
    const s = store.users.find(u => u.id === sid && u.role === 'student') || store.users[1];
    const scs = (store.student_challenges || []).filter(sc => sc.student_id === s?.id);
    const xp = scs.reduce((acc, sc) => acc + (sc.score || 0), 0);
    const lvl = getUserLevel(xp);
    return {
      status: 200,
      data: {
        student: { ...s, student_code: s?.student_id || s?.username },
        xp,
        level: lvl,
        challenges: scs,
        badges: [],
        activityLogs: []
      }
    };
  }

  // Helper for resetting student mock data
  function performMockStudentReset(targetStudentId, target = 'all_progress') {
    const sId = Number(targetStudentId);
    const s = (store.users || []).find(u => u.id === sId);
    const sCode = s?.student_id || s?.username;

    if (target === 'xp' || target === 'all' || target === 'all_progress') {
      (store.student_challenges || []).forEach(sc => {
        if (sc.student_id === sId) {
          sc.score = 0;
        }
      });
      if (store.scores) {
        store.scores = store.scores.filter(sc => {
          const matchingSC = (store.student_challenges || []).find(x => x.id === sc.student_challenge_id);
          return matchingSC ? matchingSC.student_id !== sId : true;
        });
      }
    }

    if (target === 'badges' || target === 'all' || target === 'all_progress') {
      if (store.student_badges) {
        store.student_badges = store.student_badges.filter(sb => sb.student_id !== sId);
      }
    }

    if (target === 'group' || target === 'all') {
      if (store.groups && Array.isArray(store.groups)) {
        store.groups.forEach(g => {
          if (Array.isArray(g.members)) {
            g.members = g.members.filter(m => m.id !== sId && m.student_code !== sCode && m.username !== sCode);
            g.member_count = g.members.length;
            if (g.leader_id === sId) {
              g.leader_id = g.members[0]?.id || null;
              g.leader = g.members[0] || null;
            }
          }
        });
      }
    }

    if (target === 'submissions' || target === 'all' || target === 'all_progress') {
      const scIds = (store.student_challenges || []).filter(sc => sc.student_id === sId).map(sc => sc.id);
      store.student_challenges = (store.student_challenges || []).filter(sc => sc.student_id !== sId);
      if (store.submissions) {
        store.submissions = store.submissions.filter(sub => !scIds.includes(sub.student_challenge_id) && sub.student_id !== sId);
      }
      if (store.scores) {
        store.scores = store.scores.filter(sc => !scIds.includes(sc.student_challenge_id));
      }
      if (store.feedback) {
        store.feedback = store.feedback.filter(fb => !scIds.includes(fb.student_challenge_id));
      }
      if (store.reflections) {
        store.reflections = store.reflections.filter(rf => !scIds.includes(rf.student_challenge_id));
      }
      if (store.mission_progress) {
        store.mission_progress = store.mission_progress.filter(mp => !scIds.includes(mp.student_challenge_id));
      }
      if (store.checklist_completions) {
        store.checklist_completions = store.checklist_completions.filter(cc => !scIds.includes(cc.student_challenge_id));
      }
      if (store.canva_links && store.canva_links[sId]) {
        delete store.canva_links[sId];
      }
    }

    if (target === 'assessments' || target === 'all' || target === 'all_progress' || target === 'quizzes') {
      if (store.behavior_map && store.behavior_map[sId]) delete store.behavior_map[sId];
      if (store.behavior_notes && store.behavior_notes[sId]) delete store.behavior_notes[sId];
      if (store.skill_assessments && store.skill_assessments[sId]) delete store.skill_assessments[sId];
      if (store.research_assessments) store.research_assessments = store.research_assessments.filter(r => r.student_id !== sId);
      if (store.research_skills) store.research_skills = store.research_skills.filter(r => r.student_id !== sId);
      if (store.quiz_submissions) store.quiz_submissions = store.quiz_submissions.filter(q => q.student_id !== sId);
    }

    if (target === 'activity' || target === 'all' || target === 'all_progress') {
      if (store.activity_logs) {
        store.activity_logs = store.activity_logs.filter(a => a.user_id !== sId);
      }
    }

    return true;
  }

  // Single student reset: POST /students/:id/reset
  const stuResetMatch = url.match(/^\/students\/(\d+)\/reset$/);
  if (stuResetMatch && method === 'post') {
    const sId = Number(stuResetMatch[1]);
    const target = body.target || 'all_progress';
    performMockStudentReset(sId, target);
    saveStore(store);
    return { status: 200, data: { success: true, message: `ล้างค่า ${target} ของนักเรียนเรียบร้อยแล้ว` } };
  }

  // Batch reset: POST /students/reset-batch
  if (url === '/students/reset-batch' && method === 'post') {
    const studentIds = Array.isArray(body.studentIds) ? body.studentIds : [];
    const target = body.target || 'all_progress';
    studentIds.forEach(sid => performMockStudentReset(sid, target));
    saveStore(store);
    return { status: 200, data: { success: true, count: studentIds.length, message: `ล้างค่าให้นักเรียนที่เลือก (${studentIds.length} คน) เรียบร้อยแล้ว` } };
  }

  // Class reset: POST /students/reset-class
  if (url === '/students/reset-class' && method === 'post') {
    const target = body.target || 'all_progress';
    const allStudents = (store.users || []).filter(u => u.role === 'student');
    allStudents.forEach(s => performMockStudentReset(s.id, target));
    saveStore(store);
    return { status: 200, data: { success: true, count: allStudents.length, message: `ล้างค่าข้อมูลนักเรียนทั้งห้องเรียบร้อยแล้ว` } };
  }

  if (url.match(/^\/students\/.*reset/)) {
    saveStore(store);
    return { status: 200, data: { ok: true, message: 'รีเซ็ตข้อมูลสำเร็จ' } };
  }

  // 8. Groups Management
  if (url === '/groups' && method === 'get') {
    const currentUser = getCurrentUser(store, config);
    const groups = (store.groups || []).map(g => ({
      ...g,
      member_count: g.members?.length || 0
    }));
    let myGroup = null;
    if (currentUser) {
      const uid = String(currentUser.id || '').trim();
      const ucode = String(currentUser.student_id || currentUser.username || '').trim().toLowerCase();
      const uname = String(currentUser.name || '').trim().toLowerCase();

      myGroup = groups.find(g => Array.isArray(g.members) && g.members.some(m => {
        const mid = String(m.id || '').trim();
        const mcode = String(m.student_code || m.username || m.student_id || '').trim().toLowerCase();
        const mname = String(m.name || '').trim().toLowerCase();

        return (uid && mid && uid === mid) ||
               (ucode && mcode && ucode === mcode) ||
               (uname && mname && (uname === mname || uname.includes(mname) || mname.includes(uname)));
      })) || null;
    }
    return { status: 200, data: { groups, myGroup } };
  }

  // Create Group
  if (url === '/groups' && method === 'post') {
    store.groups = store.groups || [];
    const membersList = [];
    const memberIds = Array.isArray(body.memberIds) ? body.memberIds : [];
    
    // Remove selected members from existing groups
    if (memberIds.length > 0) {
      store.groups.forEach(g => {
        if (g.members) {
          g.members = g.members.filter(m => !memberIds.includes(m.id));
          g.member_count = g.members.length;
          if (g.leader_id && memberIds.includes(g.leader_id)) {
            g.leader_id = g.members[0]?.id || null;
            g.leader = g.members[0] || null;
          }
        }
      });
      memberIds.forEach(sid => {
        const u = store.users.find(usr => usr.id === sid);
        if (u) {
          membersList.push({
            id: u.id,
            name: u.name,
            username: u.username,
            student_code: u.student_id || u.username,
            class_name: u.class_name || 'ปวช.1/1'
          });
        }
      });
    }

    const leaderId = body.leaderId || (membersList.length > 0 ? membersList[0].id : null);
    const leader = membersList.find(m => m.id === leaderId) || null;

    const newG = {
      id: Date.now(),
      name: body.name || `กลุ่ม ${store.groups.length + 1}`,
      class_id: 1,
      members: membersList,
      leader_id: leaderId,
      leader: leader,
      member_count: membersList.length
    };
    store.groups.push(newG);
    saveStore(store);
    return { status: 201, data: { message: 'สร้างกลุ่มสำเร็จ', group: newG, groupId: newG.id } };
  }

  // Edit Group (PUT /groups/:id)
  const grpPutMatch = url.match(/^\/groups\/(\d+)$/);
  if (grpPutMatch && method === 'put') {
    const gid = Number(grpPutMatch[1]);
    store.groups = store.groups || [];
    const grp = store.groups.find(g => g.id === gid);
    if (!grp) {
      const err = new Error('ไม่พบกลุ่ม');
      err.response = { status: 404, data: { error: 'ไม่พบกลุ่ม' } };
      throw err;
    }

    if (body.name && body.name.trim()) {
      grp.name = body.name.trim();
    }

    if (Array.isArray(body.memberIds)) {
      const targetIds = body.memberIds;
      // Remove these members from any other group
      store.groups.forEach(g => {
        if (g.id !== gid && g.members) {
          g.members = g.members.filter(m => !targetIds.includes(m.id));
          g.member_count = g.members.length;
          if (g.leader_id && targetIds.includes(g.leader_id)) {
            g.leader_id = g.members[0]?.id || null;
            g.leader = g.members[0] || null;
          }
        }
      });

      // Assemble new members for this group
      const newMembers = [];
      targetIds.forEach(sid => {
        const u = store.users.find(usr => usr.id === sid);
        if (u) {
          newMembers.push({
            id: u.id,
            name: u.name,
            username: u.username,
            student_code: u.student_id || u.username,
            class_name: u.class_name || 'ปวช.1/1'
          });
        }
      });
      grp.members = newMembers;
      grp.member_count = newMembers.length;
    }

    if (body.leaderId !== undefined) {
      grp.leader_id = body.leaderId || null;
      grp.leader = (grp.members || []).find(m => m.id === grp.leader_id) || null;
    } else {
      // Ensure leader is still valid
      if (grp.leader_id && !grp.members?.some(m => m.id === grp.leader_id)) {
        grp.leader_id = grp.members?.[0]?.id || null;
        grp.leader = grp.members?.[0] || null;
      }
    }

    saveStore(store);
    return { status: 200, data: { message: 'แก้ไขกลุ่มสำเร็จ', group: grp } };
  }

  // Clear all groups (DELETE /groups)
  if (url === '/groups' && method === 'delete') {
    store.groups = [];
    saveStore(store);
    return { status: 200, data: { message: 'ลบกลุ่มทั้งหมดสำเร็จ' } };
  }

  // Delete single group (DELETE /groups/:id)
  const grpDelMatch = url.match(/^\/groups\/(\d+)$/);
  if (grpDelMatch && method === 'delete') {
    const gid = Number(grpDelMatch[1]);
    store.groups = (store.groups || []).filter(g => g.id !== gid);
    saveStore(store);
    return { status: 200, data: { message: 'ลบกลุ่มสำเร็จ' } };
  }

  // Add member to group (POST /groups/:id/members)
  const addMemMatch = url.match(/^\/groups\/(\d+)\/members$/);
  if (addMemMatch && method === 'post') {
    const gid = Number(addMemMatch[1]);
    const sid = Number(body.studentId);
    store.groups = store.groups || [];
    const grp = store.groups.find(g => g.id === gid);
    if (grp && sid) {
      // Remove from other groups
      store.groups.forEach(g => {
        if (g.members) {
          g.members = g.members.filter(m => m.id !== sid);
          g.member_count = g.members.length;
        }
      });
      // Add to this group
      const u = store.users.find(usr => usr.id === sid);
      if (u && !grp.members.some(m => m.id === sid)) {
        grp.members.push({
          id: u.id,
          name: u.name,
          username: u.username,
          student_code: u.student_id || u.username,
          class_name: u.class_name || 'ปวช.1/1'
        });
        grp.member_count = grp.members.length;
        if (!grp.leader_id) {
          grp.leader_id = u.id;
          grp.leader = grp.members[0];
        }
      }
      saveStore(store);
    }
    return { status: 200, data: { message: 'เพิ่มสมาชิกเรียบร้อย' } };
  }

  // Remove member from group (DELETE /groups/:id/members/:studentId)
  const delMemMatch = url.match(/^\/groups\/(\d+)\/members\/(\d+)$/);
  if (delMemMatch && method === 'delete') {
    const gid = Number(delMemMatch[1]);
    const sid = Number(delMemMatch[2]);
    store.groups = store.groups || [];
    const grp = store.groups.find(g => g.id === gid);
    if (grp && grp.members) {
      grp.members = grp.members.filter(m => m.id !== sid);
      grp.member_count = grp.members.length;
      if (grp.leader_id === sid) {
        grp.leader_id = grp.members[0]?.id || null;
        grp.leader = grp.members[0] || null;
      }
      saveStore(store);
    }
    return { status: 200, data: { message: 'นำสมาชิกออกจากกลุ่มสำเร็จ' } };
  }

  // Student join group (POST /groups/:id/join)
  const joinMatch = url.match(/^\/groups\/(\d+)\/join$/);
  if (joinMatch && method === 'post') {
    const gid = Number(joinMatch[1]);
    const currentUser = getCurrentUser(store);
    store.groups = store.groups || [];
    const grp = store.groups.find(g => g.id === gid);
    if (grp && currentUser) {
      // Remove from any existing group
      store.groups.forEach(g => {
        if (g.members) {
          g.members = g.members.filter(m => m.id !== currentUser.id);
          g.member_count = g.members.length;
        }
      });
      grp.members = grp.members || [];
      grp.members.push({
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        student_code: currentUser.student_id || currentUser.username,
        class_name: currentUser.class_name || 'ปวช.1/1'
      });
      grp.member_count = grp.members.length;
      saveStore(store);
    }
    return { status: 200, data: { message: 'เข้าร่วมกลุ่มสำเร็จ' } };
  }

  // Student leave group (POST /groups/:id/leave)
  const leaveMatch = url.match(/^\/groups\/(\d+)\/leave$/);
  if (leaveMatch && method === 'post') {
    const gid = Number(leaveMatch[1]);
    const currentUser = getCurrentUser(store);
    store.groups = store.groups || [];
    const grp = store.groups.find(g => g.id === gid);
    if (grp && currentUser && grp.members) {
      grp.members = grp.members.filter(m => m.id !== currentUser.id);
      grp.member_count = grp.members.length;
      if (grp.leader_id === currentUser.id) {
        grp.leader_id = grp.members[0]?.id || null;
        grp.leader = grp.members[0] || null;
      }
      saveStore(store);
    }
    return { status: 200, data: { message: 'ออกจากกลุ่มสำเร็จ' } };
  }

  // Random grouping for all 43 students
  if (url === '/groups/random' && method === 'post') {
    const num = Number(body.numGroups) || 8;
    const students = (store.users || []).filter(u => u.role === 'student');
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const newGroups = [];
    for (let i = 0; i < num; i++) {
      newGroups.push({
        id: Date.now() + i,
        name: `กลุ่ม ${String(i + 1).padStart(2, '0')}`,
        class_id: 1,
        members: []
      });
    }
    shuffled.forEach((stu, idx) => {
      const grpIdx = idx % num;
      newGroups[grpIdx].members.push({
        id: stu.id,
        name: stu.name,
        username: stu.username,
        student_code: stu.student_id || stu.username,
        class_name: stu.class_name || 'ปวช.1/1'
      });
    });
    newGroups.forEach(g => {
      g.member_count = g.members.length;
      g.leader = g.members[0] || null;
      g.leader_id = g.members[0]?.id || null;
    });
    store.groups = newGroups;
    saveStore(store);
    return { status: 200, data: { ok: true, groups: newGroups } };
  }

  // Group Canva Link (ต้องเป็นของแต่ละกลุ่มเท่านั้น ให้นักเรียนเพิ่มเอง)
  const canvaLinkMatch = url.match(/^\/groups\/canva-link\/(\d+)$/);
  if (canvaLinkMatch) {
    const cid = Number(canvaLinkMatch[1]);
    const currentUser = getCurrentUser(store);
    const myGrp = (store.groups || []).find(g => 
      g.members?.some(m => m.id === currentUser?.id || m.student_code === currentUser?.username || m.student_code === currentUser?.student_id)
    );
    const hasGroup = !!myGrp;
    store.group_canva_links = store.group_canva_links || {};

    if (method === 'get') {
      if (!hasGroup) {
        return { 
          status: 200, 
          data: { 
            hasGroup: false,
            groupId: null,
            groupName: null,
            link: null,
            canvaLink: null,
            setByName: null,
            members: []
          } 
        };
      }

      // ดึงลิงก์ Canva เฉพาะของกลุ่มตัวเองเท่านั้น
      const groupKey = `${cid}_${myGrp.id}`;
      const groupData = store.group_canva_links[groupKey];

      // Fallback: ตรวจสอบว่าสมาชิกในกลุ่มนี้มีใครเคยส่งลิงก์ไว้หรือไม่
      let fallbackLink = null;
      let fallbackName = null;
      if (!groupData?.link && myGrp.members) {
        for (const m of myGrp.members) {
          const memSc = (store.student_challenges || []).find(s => s.student_id === m.id && s.challenge_id === cid);
          if (memSc?.canva_link) {
            fallbackLink = memSc.canva_link;
            fallbackName = m.name;
            break;
          }
        }
      }

      const link = groupData?.link || fallbackLink || null;
      const setByName = groupData?.setByName || fallbackName || null;

      return { 
        status: 200, 
        data: { 
          hasGroup: true,
          groupId: myGrp.id,
          groupName: myGrp.name,
          link,
          canvaLink: link,
          setByName,
          setBy: groupData?.setBy || null,
          members: myGrp.members || []
        } 
      };
    }

    if (method === 'post') {
      if (!hasGroup) {
        return { 
          status: 400, 
          data: { error: 'คุณยังไม่ได้อยู่ในกลุ่ม — ลิงก์ Canva ต้องเป็นของแต่ละกลุ่มเท่านั้น กรุณาเข้ากลุ่มก่อน' } 
        };
      }

      const newLink = (body.canvaLink || body.link || '').trim();
      if (!newLink) {
        return { 
          status: 400, 
          data: { error: 'กรุณากรอกลิงก์ Canva' } 
        };
      }

      const groupKey = `${cid}_${myGrp.id}`;
      store.group_canva_links[groupKey] = {
        challengeId: cid,
        groupId: myGrp.id,
        groupName: myGrp.name,
        link: newLink,
        setBy: currentUser?.id || null,
        setByName: currentUser?.name || 'สมาชิกในกลุ่ม',
        updatedAt: new Date().toISOString()
      };

      // ซิงค์ canva_link ไปยัง student_challenges ของสมาชิกในกลุ่มที่เริ่มกิจกรรมแล้ว
      if (myGrp.members) {
        myGrp.members.forEach(m => {
          const memSc = (store.student_challenges || []).find(s => s.student_id === m.id && s.challenge_id === cid);
          if (memSc && !memSc.canva_link) {
            memSc.canva_link = newLink;
          }
        });
      }

      saveStore(store);
      return { 
        status: 200, 
        data: { 
          ok: true, 
          hasGroup: true,
          groupId: myGrp.id,
          groupName: myGrp.name,
          link: newLink,
          canvaLink: newLink,
          setByName: currentUser?.name || 'สมาชิกในกลุ่ม',
          message: `ตั้งลิงก์ Canva สำหรับ ${myGrp.name} สำเร็จ`
        } 
      };
    }
  }

  // Heartbeat - Real-time active tracking
  if (url === '/groups/heartbeat' && method === 'post') {
    const currentUser = getCurrentUser(store);
    const cid = Number(body.challengeId);
    if (currentUser && cid) {
      store.challenge_activity = store.challenge_activity || {};
      store.challenge_activity[currentUser.id] = {
        studentId: currentUser.id,
        challengeId: cid,
        lastSeen: Date.now()
      };
      saveStore(store);
    }
    return { status: 200, data: { ok: true } };
  }

  // Real-time Activity Tracker - Who is working or not working
  const activityMatch = url.match(/^\/groups\/activity\/(\d+)$/);
  if (activityMatch && method === 'get') {
    const cid = Number(activityMatch[1]);
    const students = (store.users || []).filter(u => u.role === 'student');
    store.challenge_activity = store.challenge_activity || {};

    let activeCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;
    let submittedCount = 0;

    const studentList = students.map(s => {
      // Find group
      const grp = (store.groups || []).find(g => 
        g.members?.some(m => m.id === s.id || m.student_code === s.username || m.student_code === s.student_id)
      );

      // Find challenge progress
      const sc = (store.student_challenges || []).find(scItem => scItem.student_id === s.id && scItem.challenge_id === cid);
      const isSubmitted = sc?.status === 'submitted' || sc?.status === 'graded' || !!sc?.canva_link;
      const isInProgress = sc?.status === 'in_progress';

      // Check real-time heartbeat (within last 5 minutes)
      const act = store.challenge_activity[s.id];
      const isRecentlyActive = act && act.challengeId === cid && (Date.now() - act.lastSeen < 5 * 60 * 1000);

      let workingStatus = 'not_started';
      let statusLabel = 'ยังไม่เริ่มทำ';

      if (isSubmitted) {
        workingStatus = 'submitted';
        statusLabel = 'ส่งงานแล้ว';
        submittedCount++;
      } else if (isRecentlyActive) {
        workingStatus = 'active';
        statusLabel = 'กำลังทำงานอยู่';
        activeCount++;
      } else if (isInProgress) {
        workingStatus = 'in_progress';
        statusLabel = 'ทำค้างไว้';
        inProgressCount++;
      } else {
        workingStatus = 'not_started';
        statusLabel = 'ยังไม่เริ่มทำ';
        notStartedCount++;
      }

      return {
        id: s.id,
        name: s.name,
        username: s.username,
        studentCode: s.student_id || s.username,
        groupId: grp?.id || null,
        groupName: grp?.name || 'ยังไม่มีกลุ่ม',
        workingStatus,
        statusLabel,
        isActiveNow: isRecentlyActive,
        lastSeen: act?.lastSeen ? new Date(act.lastSeen).toISOString() : null,
        canvaLink: sc?.canva_link || (grp ? store.group_canva_links?.[`${cid}_${grp.id}`]?.link : null) || null,
        submittedAt: sc?.submitted_at || null,
        isOnTime: sc?.is_on_time ?? 1
      };
    });

    const byGroupMap = {};
    studentList.forEach(s => {
      const key = s.groupId || 'nogroup';
      if (!byGroupMap[key]) {
        byGroupMap[key] = {
          groupId: s.groupId,
          groupName: s.groupName,
          activeCount: 0,
          totalCount: 0,
          members: []
        };
      }
      byGroupMap[key].members.push(s);
      byGroupMap[key].totalCount++;
      if (s.isActiveNow) byGroupMap[key].activeCount++;
    });

    return {
      status: 200,
      data: {
        activeCount,
        inProgressCount,
        notStartedCount,
        submittedCount,
        totalCount: studentList.length,
        students: studentList,
        byGroup: Object.values(byGroupMap)
      }
    };
  }

  // Summary per group (แยกผลงานและลิงก์ Canva ตามแต่ละกลุ่มอย่างชัดเจน)
  const summaryMatch = url.match(/^\/groups\/summary\/(\d+)$/);
  if (summaryMatch) {
    const cid = Number(summaryMatch[1]);
    store.group_canva_links = store.group_canva_links || {};
    const groups = (store.groups || []).map(g => {
      const mems = (g.members || []).map(m => {
        const sc = (store.student_challenges || []).find(s => s.student_id === m.id && s.challenge_id === cid);
        return {
          ...m,
          status: sc ? sc.status : 'not_started',
          submitted_at: sc?.submitted_at || null,
          canva_link: sc?.canva_link || null,
          score: sc?.score ?? null
        };
      });

      // ดึงลิงก์ Canva เฉพาะของกลุ่ม g นี้เท่านั้น ห้ามปนกับกลุ่มอื่น
      const groupData = store.group_canva_links[`${cid}_${g.id}`];
      const memberLink = mems.find(m => m.canva_link)?.canva_link;
      const canvaLink = groupData?.link || memberLink || null;

      const gradedMems = mems.filter(m => m.score !== null && m.score !== undefined);
      const avgScore = gradedMems.length > 0 ? (gradedMems.reduce((sum, m) => sum + m.score, 0) / gradedMems.length) : null;

      return {
        ...g,
        members: mems,
        canvaLink,
        submittedCount: mems.filter(m => m.submitted_at || m.canva_link).length,
        avgScore
      };
    });
    return { status: 200, data: { groups } };
  }

  // 9. Research Assessments
  if (url === '/assessments/rubric-definition') {
    return { status: 200, data: RUBRIC_STRUCTURE };
  }

  // Behavior Assessment - 43 students
  if (url.startsWith('/assessments/behavior') && method === 'get') {
    const students = (store.users || []).filter(u => u.role === 'student');
    store.behavior_map = store.behavior_map || {};
    store.behavior_notes = store.behavior_notes || {};

    const challengeId = params.challengeId ? Number(params.challengeId) : null;
    let systemMap = {};
    if (challengeId) {
      (store.student_challenges || []).filter(sc => sc.challenge_id === challengeId).forEach(sc => {
        systemMap[sc.student_id] = {
          student_id: sc.student_id,
          challenge_status: sc.status,
          submitted_at: sc.submitted_at,
          is_on_time: sc.is_on_time ?? 1,
          canva_link: sc.canva_link
        };
      });
    }

    const result = students.map((stu, index) => {
      const savedStatus = store.behavior_map[stu.id];
      const sys = systemMap[stu.id];
      let currentStatus = savedStatus !== undefined ? savedStatus : (sys ? (sys.is_on_time ? 'on_time' : 'late') : null);

      return {
        orderNum: index + 1,
        studentId: stu.id,
        studentCode: stu.student_id || stu.username,
        name: stu.name,
        className: stu.class_name || 'ปวช.1/1',
        status: currentStatus, // 'on_time' | 'late' | 'missing' | null
        isSaved: savedStatus !== undefined,
        evaluatedAt: savedStatus ? new Date().toISOString() : null,
        note: store.behavior_notes[stu.id] || '',
        systemData: sys || null
      };
    });

    return {
      status: 200,
      data: {
        challengeId,
        sessionName: params.sessionName || 'ทั่วไป',
        students: result,
        summary: {
          total: result.length,
          onTimeCount: result.filter(r => r.status === 'on_time').length,
          lateCount: result.filter(r => r.status === 'late').length,
          missingCount: result.filter(r => r.status === 'missing').length
        }
      }
    };
  }

  if (url === '/assessments/behavior/batch' && method === 'post') {
    store.behavior_map = store.behavior_map || {};
    store.behavior_notes = store.behavior_notes || {};
    const { assessments } = body;
    if (Array.isArray(assessments)) {
      assessments.forEach(a => {
        if (a.studentId) {
          store.behavior_map[a.studentId] = a.status;
          if (a.note !== undefined) store.behavior_notes[a.studentId] = a.note;
        }
      });
    }
    saveStore(store);
    return { status: 200, data: { success: true, count: assessments?.length || 0 } };
  }

  if (url === '/assessments/behavior/auto-sync' && method === 'post') {
    store.behavior_map = store.behavior_map || {};
    const cid = Number(body.challengeId);
    let synced = 0;
    (store.student_challenges || []).filter(sc => sc.challenge_id === cid).forEach(sc => {
      if (sc.status === 'submitted' || sc.status === 'graded') {
        store.behavior_map[sc.student_id] = sc.is_on_time ? 'on_time' : 'late';
        synced++;
      } else {
        store.behavior_map[sc.student_id] = 'missing';
        synced++;
      }
    });
    saveStore(store);
    return { status: 200, data: { success: true, syncedCount: synced } };
  }

  // Skills Assessment - 43 students
  if (url.startsWith('/assessments/skills') && method === 'get') {
    const students = (store.users || []).filter(u => u.role === 'student');
    store.skill_assessments = store.skill_assessments || {};
    const assessmentType = params.assessmentType || 'post';

    const result = students.map((stu, index) => {
      const key = `${stu.id}_${assessmentType}`;
      const a = store.skill_assessments[key];
      return {
        orderNum: index + 1,
        studentId: stu.id,
        studentCode: stu.student_id || stu.username,
        name: stu.name,
        className: stu.class_name || 'ปวช.1/1',
        isEvaluated: !!a,
        scores: a?.scores || {},
        totalScore: a?.totalScore || 0,
        scorePercentage: a?.scorePercentage || 0,
        qualityLevel: a?.qualityLevel || 'ยังไม่ประเมิน',
        comments: a?.comments || '',
        evaluatorName: 'นางสาวศิริประภา สมบัติคำ',
        evaluatedAt: a?.evaluatedAt || null
      };
    });

    const evaluatedOnly = result.filter(r => r.isEvaluated);
    const avgScore = evaluatedOnly.length > 0 
      ? Number((evaluatedOnly.reduce((acc, cur) => acc + cur.totalScore, 0) / evaluatedOnly.length).toFixed(2))
      : 0;
    const avgPercent = evaluatedOnly.length > 0
      ? Number((evaluatedOnly.reduce((acc, cur) => acc + cur.scorePercentage, 0) / evaluatedOnly.length).toFixed(2))
      : 0;

    return {
      status: 200,
      data: {
        students: result,
        summary: {
          total: result.length,
          evaluatedCount: evaluatedOnly.length,
          averageScore: avgScore,
          averagePercentage: avgPercent
        }
      }
    };
  }

  if (url === '/assessments/skills' && method === 'post') {
    store.skill_assessments = store.skill_assessments || {};
    const { studentId, assessmentType = 'post', scores = {}, comments = '' } = body;
    const key = `${studentId}_${assessmentType}`;

    let sum = 0;
    let count = 0;
    Object.values(scores).forEach(s => { sum += Number(s) || 0; count++; });
    const percent = count > 0 ? Number(((sum / (21 * 5)) * 100).toFixed(2)) : 0;
    let quality = 'ปรับปรุง';
    if (percent >= 80) quality = 'ดีเยี่ยม';
    else if (percent >= 70) quality = 'ดีมาก';
    else if (percent >= 60) quality = 'ปานกลาง';
    else if (percent >= 50) quality = 'พอใช้';

    store.skill_assessments[key] = {
      scores,
      totalScore: sum,
      scorePercentage: percent,
      qualityLevel: quality,
      comments,
      evaluatorName: 'นางสาวศิริประภา สมบัติคำ',
      evaluatedAt: new Date().toISOString()
    };

    saveStore(store);
    return { status: 200, data: { success: true, saved: store.skill_assessments[key] } };
  }

  // Export CSV
  if (url.startsWith('/assessments/export/behavior/csv')) {
    const students = (store.users || []).filter(u => u.role === 'student');
    store.behavior_map = store.behavior_map || {};
    let csv = '\uFEFFลำดับ,รหัสนักเรียน,ชื่อ-สกุล,ชั้นเรียน,ส่งตรงเวลา,ส่งล่าช้า,ไม่ส่งงาน,สถานะ,หมายเหตุ\n';
    students.forEach((s, idx) => {
      const st = store.behavior_map[s.id] || 'on_time';
      const onTime = st === 'on_time' ? '1' : '0';
      const late = st === 'late' ? '1' : '0';
      const missing = st === 'missing' ? '1' : '0';
      const label = st === 'on_time' ? 'ส่งตรงเวลา' : (st === 'late' ? 'ส่งล่าช้า' : 'ไม่ส่งงาน');
      csv += `${idx + 1},"${s.student_id || s.username}","${s.name}","${s.class_name || 'ปวช.1/1'}",${onTime},${late},${missing},"${label}",""\n`;
    });
    return { status: 200, data: csv, headers: { 'content-type': 'text/csv; charset=utf-8' } };
  }

  if (url.startsWith('/assessments/export/skills/csv')) {
    const students = (store.users || []).filter(u => u.role === 'student');
    store.skill_assessments = store.skill_assessments || {};
    let csv = '\uFEFFลำดับ,รหัสนักเรียน,ชื่อ-สกุล,ชั้นเรียน,คะแนนรวม (เต็ม 105),ร้อยละ,ระดับคุณภาพ,ข้อคิดเห็น\n';
    students.forEach((s, idx) => {
      const a = store.skill_assessments[`${s.id}_post`] || store.skill_assessments[`${s.id}_pre`];
      csv += `${idx + 1},"${s.student_id || s.username}","${s.name}","${s.class_name || 'ปวช.1/1'}",${a?.totalScore || 0},${a?.scorePercentage || 0},"${a?.qualityLevel || 'ยังไม่ประเมิน'}","${a?.comments || ''}"\n`;
    });
    return { status: 200, data: csv, headers: { 'content-type': 'text/csv; charset=utf-8' } };
  }

  // 10. Analytics
  if (url === '/analytics/class') {
    const students = (store.users || []).filter(u => u.role === 'student');
    const totalStudents = students.length || 43;
    const challenges = (store.challenges || []).filter(c => c.status === 'active');
    
    let submitted = 0;
    let onTime = 0;
    let late = 0;
    let inProgress = 0;
    let notStarted = 0;

    challenges.forEach(c => {
      const rows = (store.student_challenges || []).filter(sc => sc.challenge_id === c.id);
      rows.forEach(r => {
        if (r.status === 'graded' || r.status === 'submitted') {
          submitted++;
          if (r.is_on_time === 1 || !r.is_late) onTime++;
          else late++;
        } else if (r.status === 'in_progress') {
          inProgress++;
        }
      });
      notStarted += Math.max(0, totalStudents - rows.length);
    });

    const summary = {
      totalStudents,
      submitted,
      onTime,
      late,
      inProgress,
      notStarted: challenges.length > 0 ? notStarted : 0
    };

    return {
      status: 200,
      data: {
        totalStudents,
        summary,
        activeChallenges: challenges.length,
        submissionRate: challenges.length > 0 ? Math.round((submitted / (totalStudents * challenges.length)) * 100) : 0,
        avgScore: 0,
        performance: { avgScore: 0, maxScore: 0, minScore: 0 },
        reflectionStats: { avgSelfScore: 5.0, totalReflections: 0 },
        dailySubmissions: [],
        challengeStats: (store.challenges || []).map(c => {
          const rows = (store.student_challenges || []).filter(sc => sc.challenge_id === c.id);
          const submittedCount = rows.filter(r => ['submitted', 'graded'].includes(r.status)).length;
          const onTimeCount = rows.filter(r => r.is_on_time === 1 || !r.is_late).length;
          const lateCount = rows.filter(r => r.is_on_time === 0 || r.is_late).length;
          return {
            id: c.id,
            title: c.title,
            difficulty: c.difficulty,
            totalEnrolled: totalStudents,
            submittedCount,
            onTimeCount,
            lateCount,
            avgScore: 0,
            notStarted: Math.max(0, totalStudents - rows.length)
          };
        }),
        xpDistribution: [
          { name: 'Beginner', count: totalStudents },
          { name: 'Explorer', count: 0 },
          { name: 'Creator', count: 0 },
          { name: 'Problem Solver', count: 0 },
          { name: 'Challenge Master', count: 0 }
        ],
        submissionTrends: []
      }
    };
  }

  if (url === '/analytics/research') {
    return {
      status: 200,
      data: {
        beforeAvg: 0,
        afterAvg: 0,
        improvementPercent: 0,
        pairedTTest: { t: 0, p: 'N/A', significant: false }
      }
    };
  }

  // 11. Gamification
  if (url === '/gamification/my/xp') {
    const user = getCurrentUser(store);
    const scs = (store.student_challenges || []).filter(sc => sc.student_id === user?.id);
    const xp = scs.reduce((acc, sc) => acc + (sc.score || 0), 0);
    const lvl = getUserLevel(xp);
    return {
      status: 200,
      data: { xp, level: lvl, nextLevelXp: lvl.maxXp + 1 }
    };
  }

  if (url === '/gamification/my/badges') {
    const badges = (store.badges || []).map(b => ({
      ...b,
      unlocked: false,
      unlocked_at: null
    }));
    return { status: 200, data: { badges } };
  }

  if (url === '/gamification/my/progress') {
    const user = getCurrentUser(store);
    const scs = (store.student_challenges || []).filter(sc => sc.student_id === user?.id);
    const completed = scs.filter(sc => sc.status === 'submitted' || sc.status === 'graded').length;
    const xp = scs.reduce((acc, sc) => acc + (sc.score || 0), 0);
    return {
      status: 200,
      data: {
        xp,
        level: getUserLevel(xp),
        completedChallenges: completed,
        onTimeRate: completed > 0 ? 100 : 0,
        badgesCount: 0,
        streakDays: 0
      }
    };
  }

  // 12. Reflections
  if (url.startsWith('/reflections/')) {
    return { status: 200, data: { ok: true } };
  }

  // 13. Notifications
  if (url === '/notifications') {
    return { status: 200, data: { notifications: [] } };
  }

  // 14. Quizzes (Pre-test & Post-test)
  if (url === '/quizzes/questions' && method === 'get') {
    const safeQuestions = POWERPOINT_QUIZ_QUESTIONS.map(q => ({
      id: q.id,
      topic: q.topic,
      question: q.question,
      options: q.options
    }));
    return { status: 200, data: { questions: safeQuestions, total: safeQuestions.length } };
  }

  if (url === '/quizzes/my-results' && method === 'get') {
    const user = getCurrentUser(store, config);
    const sId = user?.id;
    const subs = (store.quiz_submissions || []).filter(q => q.student_id === sId);
    const results = { pre: null, post: null };
    subs.forEach(r => {
      results[r.quiz_type] = {
        score: r.score,
        total_score: r.total_score,
        percentage: Math.round((r.score / r.total_score) * 100),
        submitted_at: r.submitted_at,
        answers: r.answers || {}
      };
    });
    return {
      status: 200,
      data: {
        results,
        questionsWithAnswers: POWERPOINT_QUIZ_QUESTIONS
      }
    };
  }

  if (url === '/quizzes/submit' && method === 'post') {
    const user = getCurrentUser(store, config);
    const sId = user?.id || 12;
    const { quizType, answers = {} } = body;
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

    store.quiz_submissions = store.quiz_submissions || [];
    store.quiz_submissions = store.quiz_submissions.filter(q => !(q.student_id === sId && q.quiz_type === quizType));
    store.quiz_submissions.push({
      id: Date.now(),
      student_id: sId,
      quiz_type: quizType,
      score,
      total_score: total,
      answers,
      submitted_at: new Date().toISOString()
    });

    saveStore(store);
    return {
      status: 200,
      data: {
        success: true,
        quizType,
        score,
        total_score: total,
        percentage: Math.round((score / total) * 100),
        details,
        message: `ส่งแบบทดสอบ${quizType === 'pre' ? 'ก่อนเรียน' : 'หลังเรียน'}เรียบร้อยแล้ว!`
      }
    };
  }

  if (url === '/quizzes/class-results' && method === 'get') {
    const students = (store.users || []).filter(u => u.role === 'student');
    const subs = store.quiz_submissions || [];
    const summary = students.map((s, idx) => {
      const pre = subs.find(q => q.student_id === s.id && q.quiz_type === 'pre');
      const post = subs.find(q => q.student_id === s.id && q.quiz_type === 'post');
      const gain = (post && pre) ? post.score - pre.score : null;
      let group_name = '-';
      if (store.groups) {
        const g = store.groups.find(grp => grp.members && grp.members.some(m => m.id === s.id || m.student_code === s.username));
        if (g) group_name = g.name;
      }
      return {
        orderNum: idx + 1,
        id: s.id,
        name: s.name,
        username: s.username,
        student_code: s.student_id || s.username,
        group_name,
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
    return {
      status: 200,
      data: {
        summary,
        stats: {
          totalStudents: students.length,
          totalPre,
          totalPost,
          avgPre: Number(avgPre),
          avgPost: Number(avgPost),
          avgGain: (avgPost - avgPre).toFixed(2)
        }
      }
    };
  }

  // Fallback for any other endpoint
  return { status: 200, data: { ok: true, fallback: true } };
}
