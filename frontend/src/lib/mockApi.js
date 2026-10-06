import initialData from './initialData.json';

const STORAGE_KEY = 'cbl_mock_db_v2';

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
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse mock store from localStorage', e);
  }
  // Initialize with initialData
  const store = {
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
    canva_links: {}
  };
  saveStore(store);
  return store;
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
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

function getCurrentUser(store) {
  try {
    const raw = localStorage.getItem('cbl_user');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return store.users[0]; // fallback
}

export async function handleMockRequest(config) {
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

    // Student check
    const student = store.users.find(u => u.role === 'student' && (u.username === username || u.student_id === username));
    if (student) {
      // รหัสผ่านเข้าระบบของนักเรียนคือรหัสนักเรียน
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

  // 3. Challenges
  if (url === '/challenges' && method === 'get') {
    return { status: 200, data: { challenges: store.challenges } };
  }

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
      duration_minutes: body.duration_minutes || 30,
      start_date: body.start_date || new Date().toISOString(),
      deadline: body.deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      max_score: body.max_score || 100,
      rubric: body.rubric || '',
      difficulty: body.difficulty || 'medium',
      group_size: body.group_size || 1,
      status: 'active',
      created_at: new Date().toISOString()
    };
    store.challenges.push(newChallenge);

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
    return { status: 200, data: { challenge: newChallenge, id: newId } };
  }

  // Publish / delete challenge
  const pubMatch = url.match(/^\/challenges\/(\d+)\/publish$/);
  if (pubMatch && method === 'post') {
    const cid = Number(pubMatch[1]);
    const c = store.challenges.find(ch => ch.id === cid);
    if (c) c.status = 'active';
    saveStore(store);
    return { status: 200, data: { ok: true, challenge: c } };
  }

  const chalDetailMatch = url.match(/^\/challenges\/(\d+)$/);
  if (chalDetailMatch) {
    const cid = Number(chalDetailMatch[1]);
    if (method === 'get') {
      const challenge = store.challenges.find(c => c.id === cid) || store.challenges[0];
      const missions = store.missions.filter(m => m.challenge_id === cid);
      const checklistItems = store.checklist_items.filter(cl => cl.challenge_id === cid);
      const currentUser = getCurrentUser(store);
      let studentProgress = null;
      if (currentUser?.role === 'student') {
        let sc = store.student_challenges.find(s => s.challenge_id === cid && s.student_id === currentUser.id);
        if (!sc) {
          sc = { id: Date.now(), student_id: currentUser.id, challenge_id: cid, status: 'not_started' };
          store.student_challenges.push(sc);
          saveStore(store);
        }
        const missionProgress = store.mission_progress.filter(mp => mp.student_challenge_id === sc.id);
        const checklistCompletions = store.checklist_completions.filter(cc => cc.student_challenge_id === sc.id);
        studentProgress = { ...sc, missionProgress, checklistCompletions };
      }
      return { status: 200, data: { challenge, missions, checklistItems, studentProgress } };
    }
    if (method === 'delete') {
      store.challenges = store.challenges.filter(c => c.id !== cid);
      saveStore(store);
      return { status: 200, data: { ok: true } };
    }
  }

  // Start challenge
  const startMatch = url.match(/^\/challenges\/(\d+)\/start$/);
  if (startMatch && method === 'post') {
    const cid = Number(startMatch[1]);
    const user = getCurrentUser(store);
    let sc = store.student_challenges.find(s => s.challenge_id === cid && s.student_id === user.id);
    if (!sc) {
      sc = { id: Date.now(), student_id: user.id, challenge_id: cid, status: 'in_progress', started_at: new Date().toISOString() };
      store.student_challenges.push(sc);
    } else {
      sc.status = 'in_progress';
      sc.started_at = sc.started_at || new Date().toISOString();
    }
    saveStore(store);
    return { status: 200, data: { ok: true, studentChallenge: sc } };
  }

  // Submit challenge link
  const submitLinkMatch = url.match(/^\/challenges\/(\d+)\/(submit-link|submit)$/);
  if (submitLinkMatch && method === 'post') {
    const cid = Number(submitLinkMatch[1]);
    const user = getCurrentUser(store);
    let sc = store.student_challenges.find(s => s.challenge_id === cid && s.student_id === user.id);
    if (!sc) {
      sc = { id: Date.now(), student_id: user.id, challenge_id: cid, status: 'submitted', started_at: new Date().toISOString() };
      store.student_challenges.push(sc);
    }
    sc.status = 'submitted';
    sc.submitted_at = new Date().toISOString();
    sc.canva_link = body.canvaLink || body.link || '';
    sc.note = body.note || '';

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

  // Submissions per challenge
  const subsMatch = url.match(/^\/challenges\/(\d+)\/submissions$/);
  if (subsMatch && method === 'get') {
    const cid = Number(subsMatch[1]);
    const submissions = store.student_challenges
      .filter(sc => sc.challenge_id === cid)
      .map(sc => {
        const student = store.users.find(u => u.id === sc.student_id) || {};
        return {
          id: sc.id,
          student_challenge_id: sc.id,
          student_user_id: sc.student_id,
          student_id: sc.student_id,
          student_name: student.name || 'นักเรียน',
          student_code: student.student_id || student.username,
          status: sc.status,
          submitted_at: sc.submitted_at,
          score: sc.score || null,
          max_score: 100,
          canva_link: sc.canva_link || ''
        };
      });
    return { status: 200, data: { submissions } };
  }

  // 4. Missions
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

  if (url === '/missions/teacher/toggle' || url === '/missions/teacher/batch') {
    return { status: 200, data: { ok: true } };
  }

  // 5. Checklists
  const clToggleMatch = url.match(/^\/checklists\/(\d+)\/toggle$/);
  if (clToggleMatch && method === 'post') {
    const clid = Number(clToggleMatch[1]);
    const user = getCurrentUser(store);
    const sc = store.student_challenges.find(s => s.student_id === user.id) || { id: 1 };
    const idx = store.checklist_completions.findIndex(c => c.checklist_item_id === clid && c.student_challenge_id === sc.id);
    if (idx >= 0) {
      store.checklist_completions.splice(idx, 1);
    } else {
      store.checklist_completions.push({
        id: Date.now(),
        checklist_item_id: clid,
        student_challenge_id: sc.id,
        completed_at: new Date().toISOString()
      });
    }
    saveStore(store);
    return { status: 200, data: { ok: true } };
  }

  if (url === '/checklists/teacher/toggle' || url === '/checklists/teacher/batch') {
    return { status: 200, data: { ok: true } };
  }

  // 6. Students
  if (url === '/students' && method === 'get') {
    const students = store.users
      .filter(u => u.role === 'student')
      .map((s, idx) => {
        const xp = 150 + idx * 10;
        const lvl = getUserLevel(xp);
        return {
          id: s.id,
          name: s.name,
          username: s.username,
          student_code: s.student_id || s.username,
          class_name: s.class_name || 'ปวช.1/1',
          orderNum: idx + 1,
          completed_count: idx % 3 === 0 ? 2 : 1,
          submitted_count: 2,
          on_time_count: 2,
          onTimeRate: 100,
          xp,
          level: lvl.level,
          levelName: lvl.nameTh,
          group_name: idx < 5 ? 'กลุ่ม 01' : (idx < 10 ? 'กลุ่ม 02' : '-')
        };
      });
    return { status: 200, data: { students } };
  }

  const stuDetailMatch = url.match(/^\/students\/(\d+)$/);
  if (stuDetailMatch && method === 'get') {
    const sid = Number(stuDetailMatch[1]);
    const s = store.users.find(u => u.id === sid && u.role === 'student') || store.users[1];
    const xp = 200;
    const lvl = getUserLevel(xp);
    return {
      status: 200,
      data: {
        student: { ...s, student_code: s.student_id || s.username },
        xp,
        level: lvl,
        challenges: [],
        badges: store.badges.slice(0, 3),
        activityLogs: []
      }
    };
  }

  if (url.match(/^\/students\/.*reset/)) {
    return { status: 200, data: { ok: true, message: 'รีเซ็ตข้อมูลสำเร็จ' } };
  }

  // 7. Groups
  if (url === '/groups' && method === 'get') {
    const groups = store.groups.map(g => {
      const members = store.users.filter(u => u.role === 'student').slice(0, 5);
      return { ...g, members, member_count: members.length };
    });
    return { status: 200, data: { groups } };
  }

  if (url === '/groups' && method === 'post') {
    const newG = { id: Date.now(), name: body.name || 'กลุ่มใหม่', class_id: 1, members: [] };
    store.groups.push(newG);
    saveStore(store);
    return { status: 200, data: { group: newG } };
  }

  if (url === '/groups/random' && method === 'post') {
    return { status: 200, data: { ok: true } };
  }

  const canvaLinkMatch = url.match(/^\/groups\/canva-link\/(\d+)$/);
  if (canvaLinkMatch) {
    const cid = canvaLinkMatch[1];
    if (method === 'get') {
      return { status: 200, data: { canvaLink: store.canva_links?.[cid] || '' } };
    }
    if (method === 'post') {
      store.canva_links = store.canva_links || {};
      store.canva_links[cid] = body.canvaLink || '';
      saveStore(store);
      return { status: 200, data: { ok: true, canvaLink: store.canva_links[cid] } };
    }
  }

  if (url.match(/^\/groups\/activity\//) || url.match(/^\/groups\/summary\//)) {
    return { status: 200, data: { summary: {}, activities: [] } };
  }

  if (url === '/groups/heartbeat') {
    return { status: 200, data: { ok: true } };
  }

  // 8. Assessments
  if (url === '/assessments/rubric-definition') {
    return { status: 200, data: RUBRIC_STRUCTURE };
  }

  if (url.startsWith('/assessments/behavior')) {
    const students = store.users.filter(u => u.role === 'student');
    const records = students.map((s, idx) => ({
      student_id: s.id,
      student_name: s.name,
      student_code: s.student_id || s.username,
      order_num: idx + 1,
      status: idx % 5 === 0 ? 'late' : (idx % 10 === 0 ? 'missing' : 'on_time')
    }));
    return { status: 200, data: { records, summary: { onTime: 38, late: 3, missing: 2, total: 43 } } };
  }

  if (url.startsWith('/assessments/skills')) {
    return { status: 200, data: { skills: [], total: 0 } };
  }

  // 9. Analytics
  if (url === '/analytics/class') {
    return {
      status: 200,
      data: {
        totalStudents: 43,
        activeChallenges: store.challenges.filter(c => c.status === 'active').length || 3,
        submissionRate: 92,
        avgScore: 84.5,
        xpDistribution: [
          { name: 'Beginner', count: 5 },
          { name: 'Explorer', count: 18 },
          { name: 'Creator', count: 12 },
          { name: 'Problem Solver', count: 6 },
          { name: 'Challenge Master', count: 2 }
        ],
        submissionTrends: [
          { week: 'W1', onTime: 40, late: 3 },
          { week: 'W2', onTime: 41, late: 2 },
          { week: 'W3', onTime: 42, late: 1 }
        ]
      }
    };
  }

  if (url === '/analytics/research') {
    return {
      status: 200,
      data: {
        beforeAvg: 62.4,
        afterAvg: 85.8,
        improvementPercent: 37.5,
        pairedTTest: { t: 9.84, p: '< 0.001', significant: true }
      }
    };
  }

  // 10. Gamification
  if (url === '/gamification/my/xp') {
    return {
      status: 200,
      data: {
        xp: 280,
        level: { level: 2, nameTh: 'Explorer', nameEn: 'Explorer', minXp: 150, maxXp: 399 },
        nextLevelXp: 400
      }
    };
  }

  if (url === '/gamification/my/badges') {
    const badges = store.badges.map((b, idx) => ({
      ...b,
      unlocked: idx < 3,
      unlocked_at: idx < 3 ? '2026-09-20' : null
    }));
    return { status: 200, data: { badges } };
  }

  if (url === '/gamification/my/progress') {
    return {
      status: 200,
      data: {
        xp: 280,
        level: { level: 2, nameTh: 'Explorer', nameEn: 'Explorer' },
        completedChallenges: 2,
        onTimeRate: 100,
        badgesCount: 3,
        streakDays: 4
      }
    };
  }

  // 11. Grading
  const gradeMatch = url.match(/^\/grade\/(\d+)$/);
  if (gradeMatch) {
    if (method === 'get') {
      return {
        status: 200,
        data: {
          score: { score: 90, max_score: 100 },
          feedback: { strengths: 'จัดวางองค์ประกอบได้สวยงาม สีสันน่าสนใจ', improvements: 'เพิ่มขนาดตัวอักษรหัวข้อ' },
          submission: { canva_link: 'https://canva.com/design/example' }
        }
      };
    }
    if (method === 'post') {
      return { status: 200, data: { ok: true, message: 'บันทึกคะแนนและ Feedback เรียบร้อย' } };
    }
  }

  if (url.startsWith('/grade/init/')) {
    return { status: 200, data: { id: Date.now() } };
  }

  // 12. Reflections
  if (url.startsWith('/reflections/')) {
    return { status: 200, data: { ok: true } };
  }

  // 13. Notifications
  if (url === '/notifications') {
    return {
      status: 200,
      data: {
        notifications: [
          { id: 1, title: 'ยินดีต้อนรับสู่ห้องเรียน CBL!', message: 'เริ่มต้นทำภารกิจแรกกันเลย', created_at: new Date().toISOString(), is_read: 0 }
        ]
      }
    };
  }

  // Fallback for any other endpoint
  return { status: 200, data: { ok: true, fallback: true } };
}
