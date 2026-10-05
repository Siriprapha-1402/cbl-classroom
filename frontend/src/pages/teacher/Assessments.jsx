import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  FileCheck2, 
  Sparkles, 
  Save, 
  Printer, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  ExternalLink,
  Award,
  Info,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import api, { API_SERVER } from '../../lib/api';

export default function TeacherAssessments() {
  const [activeTab, setActiveTab] = useState('behavior'); // 'behavior' | 'skills'
  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // ─── Behavior State ───
  const [behaviorStudents, setBehaviorStudents] = useState([]);
  const [behaviorSummary, setBehaviorSummary] = useState({ total: 43, onTimeCount: 0, lateCount: 0, missingCount: 0 });
  const [savingBehavior, setSavingBehavior] = useState(false);
  const [syncingBehavior, setSyncingBehavior] = useState(false);

  // ─── Skills State ───
  const [rubricStructure, setRubricStructure] = useState(null);
  const [skillMode, setSkillMode] = useState('form'); // 'form' | 'table'
  const [assessmentType, setAssessmentType] = useState('post'); // 'pre' | 'post' | 'challenge'
  const [skillsStudents, setSkillsStudents] = useState([]);
  const [skillsSummary, setSkillsSummary] = useState(null);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [currentScores, setCurrentScores] = useState({});
  const [currentComments, setCurrentComments] = useState('');
  const [savingSkill, setSavingSkill] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // โหลดรายการ Challenges
  useEffect(() => {
    api.get('/challenges')
      .then(res => {
        const list = res.data?.challenges || res.data || [];
        setChallenges(list);
        if (list.length > 0 && !selectedChallengeId) {
          setSelectedChallengeId(String(list[0].id));
        }
      })
      .catch(err => console.error('Error fetching challenges:', err));

    api.get('/assessments/rubric-definition')
      .then(res => setRubricStructure(res.data))
      .catch(err => console.error('Error fetching rubric structure:', err));
  }, []);

  // ─── Load Behavior Data ───
  const loadBehaviorData = async (cid) => {
    setLoading(true);
    try {
      const url = cid ? `/assessments/behavior?challengeId=${cid}` : '/assessments/behavior';
      const res = await api.get(url);
      setBehaviorStudents(res.data.students || []);
      setBehaviorSummary(res.data.summary || { total: 43, onTimeCount: 0, lateCount: 0, missingCount: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'behavior') {
      loadBehaviorData(selectedChallengeId);
    }
  }, [activeTab, selectedChallengeId]);

  // ─── Load Skills Data ───
  const loadSkillsData = async () => {
    setLoading(true);
    try {
      const cid = assessmentType === 'challenge' && selectedChallengeId ? `&challengeId=${selectedChallengeId}` : '';
      const roundTitle = assessmentType === 'pre' ? 'ประเมินก่อนจัดการเรียนรู้' : (assessmentType === 'post' ? 'ประเมินหลังจัดการเรียนรู้' : 'กิจกรรม Challenge');
      const res = await api.get(`/assessments/skills?assessmentType=${assessmentType}${cid}&roundTitle=${encodeURIComponent(roundTitle)}`);
      setSkillsStudents(res.data.students || []);
      setSkillsSummary(res.data.summary || null);

      // โหลดคะแนนของนักเรียนที่เลือกอยู่
      if (res.data.students && res.data.students.length > 0) {
        const curStu = res.data.students[selectedStudentIndex] || res.data.students[0];
        setCurrentScores(curStu.scores || {});
        setCurrentComments(curStu.comments || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'skills') {
      loadSkillsData();
    }
  }, [activeTab, assessmentType, selectedChallengeId]);

  // เมื่อเปลี่ยนนักเรียนในโหมด Form
  useEffect(() => {
    if (skillsStudents.length > 0 && skillsStudents[selectedStudentIndex]) {
      const stu = skillsStudents[selectedStudentIndex];
      setCurrentScores(stu.scores || {});
      setCurrentComments(stu.comments || '');
    }
  }, [selectedStudentIndex, skillsStudents]);

  // ─── Behavior Handlers ───
  const handleStatusChange = (studentId, targetStatus) => {
    const updated = behaviorStudents.map(s => {
      if (s.studentId === studentId) {
        // คลิกซ้ำที่เดิม ให้ยกเลิกการเลือก (ล้างค่าเป็น null)
        const nextStatus = s.status === targetStatus ? null : targetStatus;
        return { ...s, status: nextStatus };
      }
      return s;
    });
    setBehaviorStudents(updated);
    setBehaviorSummary({
      total: updated.length,
      onTimeCount: updated.filter(s => s.status === 'on_time').length,
      lateCount: updated.filter(s => s.status === 'late').length,
      missingCount: updated.filter(s => s.status === 'missing').length,
    });
  };

  const handleClearSingleStudent = (studentId) => {
    const updated = behaviorStudents.map(s => s.studentId === studentId ? { ...s, status: null } : s);
    setBehaviorStudents(updated);
    setBehaviorSummary({
      total: updated.length,
      onTimeCount: updated.filter(s => s.status === 'on_time').length,
      lateCount: updated.filter(s => s.status === 'late').length,
      missingCount: updated.filter(s => s.status === 'missing').length,
    });
  };

  const handleClearAllBehavior = async () => {
    if (!confirm('ต้องการล้างค่าการประเมินพฤติกรรมการส่งงานทั้งหมดหรือไม่?')) return;
    const updated = behaviorStudents.map(s => ({ ...s, status: null }));
    setBehaviorStudents(updated);
    setBehaviorSummary({
      total: updated.length,
      onTimeCount: 0,
      lateCount: 0,
      missingCount: 0,
    });
    try {
      await api.post('/assessments/behavior/clear', {
        challengeId: selectedChallengeId || null,
        sessionName: selectedChallengeId ? undefined : 'กิจกรรมทั่วไป'
      });
      setSaveSuccess('ล้างค่าการประเมินพฤติกรรมเรียบร้อยแล้ว');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetAllBehavior = (status) => {
    const updated = behaviorStudents.map(s => ({ ...s, status }));
    setBehaviorStudents(updated);
    setBehaviorSummary({
      total: updated.length,
      onTimeCount: status === 'on_time' ? updated.length : 0,
      lateCount: status === 'late' ? updated.length : 0,
      missingCount: status === 'missing' ? updated.length : 0,
    });
  };

  const handleSaveBehavior = async () => {
    setSavingBehavior(true);
    try {
      await api.post('/assessments/behavior/batch', {
        challengeId: selectedChallengeId || null,
        sessionName: selectedChallengeId ? undefined : 'กิจกรรมทั่วไป',
        assessments: behaviorStudents.map(s => ({
          studentId: s.studentId,
          status: s.status,
          note: s.note
        }))
      });
      setSaveSuccess('บันทึกแบบบันทึกพฤติกรรมการส่งงานเรียบร้อยแล้ว');
      setTimeout(() => setSaveSuccess(''), 3000);
      loadBehaviorData(selectedChallengeId);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSavingBehavior(false);
    }
  };

  const handleAutoSyncBehavior = async () => {
    if (!selectedChallengeId) {
      alert('กรุณาเลือก Challenge ก่อนทำการซิงค์ข้อมูลส่งงาน');
      return;
    }
    if (!confirm('ต้องการดึงสถานะการส่งงานจริงจากระบบมาบันทึกอัตโนมัติหรือไม่? (สถานะเดิมจะถูกอัปเดตตามประวัติการส่งงาน)')) {
      return;
    }
    setSyncingBehavior(true);
    try {
      const res = await api.post('/assessments/behavior/auto-sync', { challengeId: selectedChallengeId });
      setSaveSuccess(`ดึงข้อมูลส่งงานจากระบบสำเร็จ (${res.data.syncedCount} คน)`);
      setTimeout(() => setSaveSuccess(''), 4000);
      loadBehaviorData(selectedChallengeId);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลส่งงาน');
    } finally {
      setSyncingBehavior(false);
    }
  };

  // ─── Skills Handlers ───
  const handleScoreChange = (itemId, scoreVal) => {
    setCurrentScores(prev => ({
      ...prev,
      [itemId]: Number(scoreVal)
    }));
  };

  const handleQuickFill = (score) => {
    if (!rubricStructure) return;
    const newScores = {};
    rubricStructure.categories.forEach(cat => {
      cat.items.forEach(it => {
        newScores[it.id] = score;
      });
    });
    setCurrentScores(newScores);
  };

  const calculateCurrentTotal = () => {
    if (!rubricStructure) return { total: 0, percent: 0, quality: 'ยังไม่ประเมิน' };
    let sum = 0;
    let count = 0;
    rubricStructure.categories.forEach(cat => {
      cat.items.forEach(it => {
        sum += (Number(currentScores[it.id]) || 0);
        count++;
      });
    });
    const max = count * 5; // 105
    const percent = Number(((sum / max) * 100).toFixed(2));
    let quality = 'ปรับปรุง';
    if (percent >= 80) quality = 'ดีเยี่ยม';
    else if (percent >= 70) quality = 'ดีมาก';
    else if (percent >= 60) quality = 'ปานกลาง';
    else if (percent >= 50) quality = 'พอใช้';
    return { total: sum, percent, quality, max };
  };

  const handleSaveSkill = async (andNext = false) => {
    const currentStudent = skillsStudents[selectedStudentIndex];
    if (!currentStudent) return;
    setSavingSkill(true);
    try {
      const roundTitle = assessmentType === 'pre' ? 'ประเมินก่อนจัดการเรียนรู้' : (assessmentType === 'post' ? 'ประเมินหลังจัดการเรียนรู้' : 'กิจกรรม Challenge');
      await api.post('/assessments/skills', {
        studentId: currentStudent.studentId,
        challengeId: assessmentType === 'challenge' ? selectedChallengeId : null,
        assessmentType,
        roundTitle,
        scores: currentScores,
        comments: currentComments,
        evaluatorName: 'นางสาวศิริประภา สมบัติคำ'
      });
      setSaveSuccess(`บันทึกแบบประเมินทักษะของ ${currentStudent.name} เรียบร้อยแล้ว`);
      setTimeout(() => setSaveSuccess(''), 3000);

      // อัปเดต state ท้องถิ่น
      const scoreData = calculateCurrentTotal();
      setSkillsStudents(prev => prev.map((s, idx) => idx === selectedStudentIndex ? {
        ...s,
        isEvaluated: true,
        scores: { ...currentScores },
        totalScore: scoreData.total,
        scorePercentage: scoreData.percent,
        qualityLevel: scoreData.quality,
        comments: currentComments
      } : s));

      if (andNext && selectedStudentIndex < skillsStudents.length - 1) {
        setSelectedStudentIndex(prev => prev + 1);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกแบบประเมิน');
    } finally {
      setSavingSkill(false);
    }
  };

  const handleExportCSV = (type) => {
    const token = localStorage.getItem('cbl_token');
    let url = '';
    if (type === 'behavior') {
      const cid = selectedChallengeId ? `?challengeId=${selectedChallengeId}` : '';
      url = `${API_SERVER}/api/assessments/export/behavior/csv${cid}`;
    } else {
      const cid = assessmentType === 'challenge' && selectedChallengeId ? `&challengeId=${selectedChallengeId}` : '';
      url = `${API_SERVER}/api/assessments/export/skills/csv?assessmentType=${assessmentType}${cid}`;
    }
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const currentStudent = skillsStudents[selectedStudentIndex] || null;
  const currentTotal = calculateCurrentTotal();

  // กรองนักเรียนตามค้นหา
  const filteredBehavior = behaviorStudents.filter(s => 
    s.name.includes(searchQuery) || s.studentCode.includes(searchQuery) || String(s.orderNum).includes(searchQuery)
  );

  const filteredSkills = skillsStudents.filter(s =>
    s.name.includes(searchQuery) || s.studentCode.includes(searchQuery) || String(s.orderNum).includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* ─── Top Header (Screen view) ─── */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
            <ClipboardCheck size={16} /> เครื่องมือการวิจัยและประเมินผล CBL
          </div>
          <h1 className="text-2xl font-bold text-gray-800">แบบประเมินสำหรับครูผู้สอน</h1>
          <p className="text-xs text-gray-500 mt-1">
            โครงการ: การจัดการเรียนรู้โดยใช้รูปแบบ Challenge-Based Learning เพื่อส่งเสริมทักษะการปฏิบัติงาน รายวิชาโปรแกรมนำเสนอ ปวช.1
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
            <span>ผู้พัฒนา: <strong className="text-gray-700">นางสาวศิริประภา สมบัติคำ</strong></span>
            <span>•</span>
            <span>อาจารย์ที่ปรึกษา: <strong className="text-gray-700">นางสาวสายใจ พานิชกุล</strong></span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('behavior')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeTab === 'behavior' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock size={15} /> 1. บันทึกพฤติกรรมการส่งงาน (3 ด้าน)
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeTab === 'skills' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award size={15} /> 2. ประเมินทักษะ Canva (4 ด้าน 21 ข้อ)
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="no-print p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium flex items-center justify-between animate-fade-in">
          <span className="flex items-center gap-2"><CheckCircle2 size={18} /> {saveSuccess}</span>
          <button onClick={() => setSaveSuccess('')} className="text-green-600 hover:text-green-800 text-xs">✕</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 1: แบบบันทึกพฤติกรรมการส่งงานของนักเรียน (3 ด้าน)
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'behavior' && (
        <div className="space-y-6">
          {/* Controls & Action Bar */}
          <div className="no-print card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">เลือกกิจกรรม / Challenge:</label>
                <select
                  value={selectedChallengeId}
                  onChange={(e) => setSelectedChallengeId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-primary"
                >
                  <option value="">-- กิจกรรมทั่วไป / ภาพรวมวิชา --</option>
                  {challenges.map(c => (
                    <option key={c.id} value={c.id}>🎯 {c.title}</option>
                  ))}
                </select>
              </div>

              {/* Quick auto-sync */}
              {selectedChallengeId && (
                <button
                  onClick={handleAutoSyncBehavior}
                  disabled={syncingBehavior}
                  className="mt-4 px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold border border-blue-200 flex items-center gap-1.5 transition-all shadow-xs"
                  title="ตรวจสอบเวลาที่นักเรียนส่งงานจริงในระบบ แล้วติ๊กเลือกให้อัตโนมัติ"
                >
                  <RefreshCw size={13} className={syncingBehavior ? 'animate-spin' : ''} />
                  {syncingBehavior ? 'กำลังซิงค์...' : '⚡ ดึงข้อมูลส่งงานอัตโนมัติ'}
                </button>
              )}

              {/* Quick Actions */}
              <div className="mt-4 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetAllBehavior('on_time')}
                  className="px-2.5 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-xs font-semibold border border-green-200 transition-all"
                  title="ติ๊กส่งตรงเวลาให้ทุกคน"
                >
                  ✓ ตรงเวลาทุกคน
                </button>
                <button
                  type="button"
                  onClick={handleClearAllBehavior}
                  className="px-2.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold border border-rose-200 flex items-center gap-1 transition-all"
                  title="ล้างค่าที่เลือกไว้ทั้งหมด"
                >
                  <RotateCcw size={12} /> ล้างค่าทั้งหมด
                </button>
              </div>
            </div>

            {/* Print & Save Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExportCSV('behavior')}
                className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download size={14} /> Export CSV
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Printer size={14} /> พิมพ์แบบบันทึก (A4)
              </button>
              <button
                onClick={handleSaveBehavior}
                disabled={savingBehavior}
                className="btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save size={14} /> {savingBehavior ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>

          {/* Research Context & Instruction Box */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-xs text-gray-700 space-y-2">
            <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Info size={16} className="text-primary" /> คำชี้แจงเกณฑ์การประเมินพฤติกรรมการส่งงาน (3 ด้าน)
            </div>
            <p className="text-gray-600 leading-relaxed">
              แบบบันทึกพฤติกรรมการส่งงานฉบับนี้ จัดทำขึ้นเพื่อใช้บันทึกพฤติกรรมการส่งงานของนักเรียน ระหว่างการจัดการเรียนรู้โดยใช้รูปแบบ Challenge-Based Learning (CBL) โดยผู้วิจัยพิจารณาจากวันและเวลาที่นักเรียนส่งงานจริง และทำเครื่องหมาย ✓ ลงในช่องที่ตรงกับพฤติกรรมของนักเรียน แบ่งออกเป็น 3 ด้าน:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-white rounded-xl border border-green-200">
                <span className="font-bold text-green-700">1. ส่งงานตรงเวลา</span>
                <p className="text-[11px] text-gray-500 mt-1">
                  นักเรียนส่งชิ้นงานหรือภารกิจที่ได้รับมอบหมาย ก่อนหรือภายในวันและเวลาที่ผู้สอนกำหนด และดำเนินการส่งผ่านช่องทางที่กำหนดไว้อย่างถูกต้องและเรียบร้อย
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <span className="font-bold text-amber-700">2. ส่งงานล่าช้า</span>
                <p className="text-[11px] text-gray-500 mt-1">
                  นักเรียนส่งชิ้นงานหรือภารกิจที่ได้รับมอบหมาย หลังจากวันหรือเวลาที่ผู้สอนกำหนด ไม่ว่าจะเป็นการส่งด้วยตนเองหรือการส่งภายหลังจากได้รับการแจ้งเตือน
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-red-200">
                <span className="font-bold text-red-700">3. ไม่ส่งงาน</span>
                <p className="text-[11px] text-gray-500 mt-1">
                  นักเรียน ไม่ส่งชิ้นงานหรือภารกิจที่ได้รับมอบหมายภายในระยะเวลาที่กำหนด และไม่มีการส่งงานภายในช่วงเวลาที่ผู้วิจัยกำหนดเพิ่มเติมสำหรับการติดตามงาน
                </p>
              </div>
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
            <div className="card p-4 flex items-center justify-between border-l-4 border-slate-400">
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase">นักเรียนทั้งหมด</p>
                <h3 className="text-2xl font-bold text-gray-800">{behaviorSummary.total} คน</h3>
              </div>
              <Users size={28} className="text-slate-300" />
            </div>
            <div className="card p-4 flex items-center justify-between border-l-4 border-green-500">
              <div>
                <p className="text-[11px] text-green-600 font-bold uppercase">ส่งงานตรงเวลา</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {behaviorSummary.onTimeCount} <span className="text-xs font-normal text-gray-500">({Math.round((behaviorSummary.onTimeCount / (behaviorSummary.total || 1)) * 100)}%)</span>
                </h3>
              </div>
              <CheckCircle2 size={28} className="text-green-300" />
            </div>
            <div className="card p-4 flex items-center justify-between border-l-4 border-amber-500">
              <div>
                <p className="text-[11px] text-amber-600 font-bold uppercase">ส่งงานล่าช้า</p>
                <h3 className="text-2xl font-bold text-amber-600">
                  {behaviorSummary.lateCount} <span className="text-xs font-normal text-gray-500">({Math.round((behaviorSummary.lateCount / (behaviorSummary.total || 1)) * 100)}%)</span>
                </h3>
              </div>
              <Clock size={28} className="text-amber-300" />
            </div>
            <div className="card p-4 flex items-center justify-between border-l-4 border-red-500">
              <div>
                <p className="text-[11px] text-red-600 font-bold uppercase">ไม่ส่งงาน</p>
                <h3 className="text-2xl font-bold text-red-600">
                  {behaviorSummary.missingCount} <span className="text-xs font-normal text-gray-500">({Math.round((behaviorSummary.missingCount / (behaviorSummary.total || 1)) * 100)}%)</span>
                </h3>
              </div>
              <XCircle size={28} className="text-red-300" />
            </div>
          </div>

          {/* ─── OFFICIAL PRINTABLE FORM (ตรงตาม PDF เป๊ะๆ) ─── */}
          <div className="printable-area bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            {/* Header Document */}
            <div className="text-center space-y-1.5 pb-6 border-b border-gray-200">
              <h2 className="text-base md:text-lg font-bold text-gray-900 leading-snug">
                แบบบันทึกพฤติกรรมการส่งงานของนักเรียนของการจัดการเรียนรู้โดยใช้รูปแบบ<br />
                Challenge-Based Learning เพื่อส่งเสริมทักษะการปฏิบัติงาน รายวิชาโปรแกรมนำเสนอ<br />
                สำหรับนักเรียนระดับประกาศนียบัตรวิชาชีพชั้นปีที่ 1
              </h2>
              <div className="text-xs text-gray-600 space-y-0.5 pt-2">
                <p><strong>ชื่อโครงการ:</strong> การจัดการเรียนรู้โดยใช้รูปแบบ Challenge-Based Learning เพื่อส่งเสริมทักษะการปฏิบัติงาน รายวิชาโปรแกรมนำเสนอ</p>
                <p><strong>ผู้พัฒนา:</strong> นางสาวศิริประภา สมบัติคำ &nbsp;&nbsp;|&nbsp;&nbsp; <strong>อาจารย์ที่ปรึกษา:</strong> นางสาวสายใจ พานิชกุล</p>
                {selectedChallengeId && (
                  <p className="text-primary font-bold">
                    กิจกรรมที่บันทึก: {challenges.find(c => String(c.id) === String(selectedChallengeId))?.title || 'Challenge'}
                  </p>
                )}
              </div>
            </div>

            {/* Filter Search inside card (Screen only) */}
            <div className="no-print my-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหารหัส หรือ ชื่อนักเรียน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-400">💡 คลิกซ้ำที่ตัวเลือกเดิมเพื่อล้างค่า (ยกเลิก)</span>
                <span className="text-xs text-gray-400 font-medium">แสดง {filteredBehavior.length} จาก 43 คน</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-gray-800 text-center font-bold">
                    <th className="border border-gray-300 py-2.5 px-2 w-12">ลำดับ</th>
                    <th className="border border-gray-300 py-2.5 px-3 text-left w-28">รหัสนักเรียน</th>
                    <th className="border border-gray-300 py-2.5 px-4 text-left">รายชื่อ</th>
                    <th className="border border-gray-300 py-2.5 px-2 w-28 bg-green-50 text-green-800">ส่งงานตรงเวลา</th>
                    <th className="border border-gray-300 py-2.5 px-2 w-28 bg-amber-50 text-amber-800">ส่งงานล่าช้า</th>
                    <th className="border border-gray-300 py-2.5 px-2 w-28 bg-red-50 text-red-800">ไม่ส่งงาน</th>
                    <th className="border border-gray-300 py-2.5 px-3 text-left no-print w-40">ข้อมูลระบบ / หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBehavior.map((stu) => {
                    const sys = stu.systemData;
                    return (
                      <tr key={stu.studentId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="border border-gray-300 py-2 px-2 text-center text-gray-600 font-medium">
                          {stu.orderNum}
                        </td>
                        <td className="border border-gray-300 py-2 px-3 text-gray-600 font-mono text-[11px]">
                          {stu.studentCode}
                        </td>
                        <td className="border border-gray-300 py-2 px-4 font-medium text-gray-800">
                          {stu.name}
                        </td>

                        {/* ส่งตรงเวลา */}
                        <td
                          onClick={() => handleStatusChange(stu.studentId, 'on_time')}
                          className={`border border-gray-300 py-2 px-2 text-center cursor-pointer transition-all ${
                            stu.status === 'on_time' ? 'bg-green-100 text-green-900 font-bold' : 'hover:bg-green-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="radio"
                              name={`beh_${stu.studentId}`}
                              checked={stu.status === 'on_time'}
                              onChange={() => handleStatusChange(stu.studentId, 'on_time')}
                              className="w-4 h-4 accent-green-600 cursor-pointer"
                            />
                            <span className="hidden print:inline font-bold">✓</span>
                          </div>
                        </td>

                        {/* ส่งล่าช้า */}
                        <td
                          onClick={() => handleStatusChange(stu.studentId, 'late')}
                          className={`border border-gray-300 py-2 px-2 text-center cursor-pointer transition-all ${
                            stu.status === 'late' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-amber-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="radio"
                              name={`beh_${stu.studentId}`}
                              checked={stu.status === 'late'}
                              onChange={() => handleStatusChange(stu.studentId, 'late')}
                              className="w-4 h-4 accent-amber-600 cursor-pointer"
                            />
                            <span className="hidden print:inline font-bold">✓</span>
                          </div>
                        </td>

                        {/* ไม่ส่งงาน */}
                        <td
                          onClick={() => handleStatusChange(stu.studentId, 'missing')}
                          className={`border border-gray-300 py-2 px-2 text-center cursor-pointer transition-all ${
                            stu.status === 'missing' ? 'bg-red-100 text-red-900 font-bold' : 'hover:bg-red-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="radio"
                              name={`beh_${stu.studentId}`}
                              checked={stu.status === 'missing'}
                              onChange={() => handleStatusChange(stu.studentId, 'missing')}
                              className="w-4 h-4 accent-red-600 cursor-pointer"
                            />
                            <span className="hidden print:inline font-bold">✓</span>
                          </div>
                        </td>

                        {/* Notes / System feedback / Clear single */}
                        <td className="border border-gray-300 py-2 px-3 no-print">
                          <div className="flex items-center justify-between gap-1">
                            {sys ? (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                                sys.detectedStatus === 'on_time' ? 'bg-green-50 text-green-700' : (sys.detectedStatus === 'late' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500')
                              }`}>
                                ระบบ: {sys.detectedStatus === 'on_time' ? 'ส่งตรงเวลา' : (sys.detectedStatus === 'late' ? 'ส่งช้า' : 'ยังไม่ส่ง')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400">-</span>
                            )}
                            {stu.status && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearSingleStudent(stu.studentId);
                                }}
                                className="text-[10px] text-gray-400 hover:text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded transition-colors font-medium border border-transparent hover:border-rose-200"
                                title="ล้างค่าคนนี้"
                              >
                                ✕ ล้าง
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>


          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 2: แบบประเมินทักษะการปฏิบัติงาน Canva (4 ด้าน 21 ข้อ 5 ระดับ)
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {/* Sub Header & Mode Selector */}
          <div className="no-print card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">รอบการประเมิน:</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setAssessmentType('post')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      assessmentType === 'post' ? 'bg-white text-primary shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    ประเมินหลังจัดการเรียนรู้ (Post-test)
                  </button>
                  <button
                    onClick={() => setAssessmentType('pre')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      assessmentType === 'pre' ? 'bg-white text-primary shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    ประเมินก่อนจัดการเรียนรู้ (Pre-test)
                  </button>
                  <button
                    onClick={() => setAssessmentType('challenge')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      assessmentType === 'challenge' ? 'bg-white text-primary shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    ตาม Challenge
                  </button>
                </div>
              </div>

              {assessmentType === 'challenge' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">เลือก Challenge:</label>
                  <select
                    value={selectedChallengeId}
                    onChange={(e) => setSelectedChallengeId(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-primary"
                  >
                    {challenges.map(c => (
                      <option key={c.id} value={c.id}>🎯 {c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* View Switch */}
              <div className="mt-4 flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSkillMode('form')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    skillMode === 'form' ? 'bg-white text-primary shadow-xs' : 'text-gray-600'
                  }`}
                >
                  📝 ประเมินรายบุคคล
                </button>
                <button
                  onClick={() => setSkillMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    skillMode === 'table' ? 'bg-white text-primary shadow-xs' : 'text-gray-600'
                  }`}
                >
                  📊 ตารางสรุปทั้งห้อง (43 คน)
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExportCSV('skills')}
                className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download size={14} /> Export CSV (วิจัย)
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Printer size={14} /> พิมพ์แบบประเมิน (A4)
              </button>
            </div>
          </div>

          {/* Description & Rating Rubric Levels Box */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-xs text-gray-700 space-y-3">
            <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Info size={16} className="text-primary" /> คำชี้แจงและเกณฑ์ระดับคะแนน (Rating Scale 5 ระดับ)
            </div>
            <p className="text-gray-600 leading-relaxed">
              แบบประเมินทักษะการปฏิบัติงานฉบับนี้ จัดทำขึ้นเพื่อใช้ประเมินทักษะการปฏิบัติงานของนักเรียนในการทำกิจกรรมและสร้างผลงานในรายวิชาโปรแกรมนำเสนอ ตามการจัดการเรียนรู้โดยใช้รูปแบบ Challenge-Based Learning (CBL) โดยผู้วิจัยพิจารณาจากความสามารถในการปฏิบัติงานจริง การใช้โปรแกรม Canva การปฏิบัติงานตามขั้นตอน และคุณภาพของผลงานที่สร้างขึ้น (แบ่งเป็น 4 ด้าน รวม 21 ข้อ คะแนนเต็ม 105 คะแนน)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
              <div className="p-2.5 bg-green-50/80 border border-green-200 rounded-xl">
                <span className="font-bold text-green-800 text-xs">5 คะแนน : ดีเยี่ยม</span>
                <p className="text-[10.5px] text-green-950 mt-1">ปฏิบัติงานได้ถูกต้อง ครบถ้วน คล่องแคล่ว และดำเนินงานโดยใช้ Canva ได้ด้วยตนเองอย่างมีประสิทธิภาพ</p>
              </div>
              <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl">
                <span className="font-bold text-blue-800 text-xs">4 คะแนน : ดีมาก</span>
                <p className="text-[10.5px] text-blue-950 mt-1">ปฏิบัติงานได้ถูกต้องและครบถ้วนเป็นส่วนใหญ่ มีข้อผิดพลาดเล็กน้อย และแก้ไขได้ด้วยตนเอง</p>
              </div>
              <div className="p-2.5 bg-yellow-50/80 border border-yellow-200 rounded-xl">
                <span className="font-bold text-yellow-800 text-xs">3 คะแนน : ปานกลาง</span>
                <p className="text-[10.5px] text-yellow-950 mt-1">ปฏิบัติงานได้ตามขั้นตอนในระดับหนึ่ง มีข้อผิดพลาดบางส่วน ปฏิบัติงานได้เมื่อได้รับคำแนะนำ</p>
              </div>
              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-800 text-xs">2 คะแนน : พอใช้</span>
                <p className="text-[10.5px] text-amber-950 mt-1">ปฏิบัติงานได้บางส่วน มีข้อผิดพลาดหลายประการ ต้องได้รับคำแนะนำหรือช่วยเหลือเป็นระยะ</p>
              </div>
              <div className="p-2.5 bg-red-50/80 border border-red-200 rounded-xl">
                <span className="font-bold text-red-800 text-xs">1 คะแนน : ปรับปรุง</span>
                <p className="text-[10.5px] text-red-950 mt-1">ไม่สามารถปฏิบัติงานได้ถูกต้อง หรือไม่สามารถใช้ Canva ได้ด้วยตนเอง ต้องได้รับช่วยเหลืออย่างใกล้ชิด</p>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              MODE 1: แบบประเมินรายบุคคล (INDIVIDUAL EVALUATION FORM)
              ══════════════════════════════════════════════════════ */}
          {skillMode === 'form' && currentStudent && (
            <div className="space-y-6">
              {/* Student Selector Card with Quick Navigation */}
              <div className="no-print card flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-50/60 to-blue-50/60 border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white font-bold flex items-center justify-center text-lg shadow-md shadow-primary/20">
                    {currentStudent.orderNum}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-gray-800">{currentStudent.name}</h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-mono">
                        {currentStudent.studentCode}
                      </span>
                      {currentStudent.isEvaluated && (
                        <span className="text-[11px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={12} /> ประเมินแล้ว
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ลำดับที่ {currentStudent.orderNum} จาก 43 คน · ห้อง {currentStudent.className || 'ปวช.1/1'}
                    </p>
                  </div>
                </div>

                {/* Dropdown student picker & Prev/Next buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStudentIndex(prev => Math.max(0, prev - 1))}
                    disabled={selectedStudentIndex === 0}
                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    title="คนก่อนหน้า"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <select
                    value={selectedStudentIndex}
                    onChange={(e) => setSelectedStudentIndex(Number(e.target.value))}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-primary max-w-[200px]"
                  >
                    {skillsStudents.map((s, idx) => (
                      <option key={s.studentId} value={idx}>
                        {s.orderNum}. {s.name} {s.isEvaluated ? '✓' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setSelectedStudentIndex(prev => Math.min(skillsStudents.length - 1, prev + 1))}
                    disabled={selectedStudentIndex === skillsStudents.length - 1}
                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    title="คนถัดไป"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Quick Fill & Live Score Badge Bar */}
              <div className="no-print card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-10 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-500">⚡ กำหนดคะแนนด่วน:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFill(5)}
                    className="px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold border border-green-200 transition-all"
                  >
                    ⭐ ให้ 5 (ดีเยี่ยม) ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill(4)}
                    className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition-all"
                  >
                    ⭐ ให้ 4 (ดีมาก) ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill(3)}
                    className="px-2.5 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-xs font-semibold border border-yellow-200 transition-all"
                  >
                    ⭐ ให้ 3 (ปานกลาง) ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentScores({})}
                    className="px-2.5 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold border border-gray-200 transition-all"
                  >
                    ล้างค่า
                  </button>
                </div>

                {/* Live Calculated Score */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 font-bold block">คะแนนรวม</span>
                    <span className="text-xl font-extrabold text-primary">
                      {currentTotal.total} <span className="text-xs text-gray-400 font-normal">/ 105</span>
                    </span>
                  </div>
                  <div className="text-right border-l pl-4 border-gray-200">
                    <span className="text-[11px] text-gray-400 font-bold block">ร้อยละ</span>
                    <span className="text-xl font-extrabold text-gray-800">
                      {currentTotal.percent}%
                    </span>
                  </div>
                  <div className="border-l pl-4 border-gray-200">
                    <span className="text-[11px] text-gray-400 font-bold block">ระดับคุณภาพ</span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      currentTotal.quality === 'ดีเยี่ยม' ? 'bg-green-100 text-green-800' :
                      currentTotal.quality === 'ดีมาก' ? 'bg-blue-100 text-blue-800' :
                      currentTotal.quality === 'ปานกลาง' ? 'bg-yellow-100 text-yellow-800' :
                      currentTotal.quality === 'พอใช้' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {currentTotal.quality}
                    </span>
                  </div>
                </div>
              </div>

              {/* ─── Printable Individual Rubric Form ─── */}
              <div className="printable-area bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                {/* Form Header */}
                <div className="text-center space-y-1.5 pb-4 border-b border-gray-200">
                  <h2 className="text-base md:text-lg font-bold text-gray-900 leading-snug">
                    แบบประเมินทักษะการปฏิบัติงาน รายวิชาโปรแกรมนำเสนอ<br />
                    สำหรับนักเรียนระดับประกาศนียบัตรวิชาชีพชั้นปีที่ 1
                  </h2>
                  <p className="text-xs text-gray-600">
                    <strong>การจัดการเรียนรู้โดยใช้รูปแบบ Challenge-Based Learning (CBL)</strong> เพื่อส่งเสริมทักษะการปฏิบัติงาน
                  </p>
                  <div className="pt-2 text-xs flex justify-between items-center text-gray-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div><strong>ผู้รับการประเมิน:</strong> {currentStudent.name} (รหัส {currentStudent.studentCode})</div>
                    <div><strong>ลำดับที่:</strong> {currentStudent.orderNum}</div>
                    <div><strong>รอบการประเมิน:</strong> {assessmentType === 'pre' ? 'ก่อนจัดการเรียนรู้ (Pre-test)' : (assessmentType === 'post' ? 'หลังจัดการเรียนรู้ (Post-test)' : 'ตามกิจกรรม Challenge')}</div>
                  </div>
                </div>

                {/* 4 Categories Table */}
                {rubricStructure?.categories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span>{category.id}. {category.name}</span>
                      <span className="text-[11px] font-normal text-gray-500">({category.items.length} ข้อ)</span>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-700 text-center font-bold border-b border-gray-200">
                            <th className="py-2 px-3 text-left">รายการประเมิน</th>
                            <th className="py-2 px-2 w-12 bg-green-50/50">5<br/><span className="text-[10px] font-normal text-gray-400">ดีเยี่ยม</span></th>
                            <th className="py-2 px-2 w-12 bg-blue-50/50">4<br/><span className="text-[10px] font-normal text-gray-400">ดีมาก</span></th>
                            <th className="py-2 px-2 w-12 bg-yellow-50/50">3<br/><span className="text-[10px] font-normal text-gray-400">ปานกลาง</span></th>
                            <th className="py-2 px-2 w-12 bg-amber-50/50">2<br/><span className="text-[10px] font-normal text-gray-400">พอใช้</span></th>
                            <th className="py-2 px-2 w-12 bg-red-50/50">1<br/><span className="text-[10px] font-normal text-gray-400">ปรับปรุง</span></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150">
                          {category.items.map((item) => {
                            const val = currentScores[item.id] || null;
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-2.5 px-3 text-gray-800">
                                  <span className="font-semibold text-gray-600 mr-2">{item.id}</span>
                                  {item.text}
                                </td>
                                {[5, 4, 3, 2, 1].map((s) => (
                                  <td
                                    key={s}
                                    onClick={() => handleScoreChange(item.id, s)}
                                    className={`py-2 px-2 text-center cursor-pointer transition-all ${
                                      val === s ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center">
                                      <input
                                        type="radio"
                                        name={`score_${item.id}`}
                                        checked={val === s}
                                        onChange={() => handleScoreChange(item.id, s)}
                                        className="w-4 h-4 accent-primary cursor-pointer"
                                      />
                                      <span className="hidden print:inline font-bold ml-1">{val === s ? '✓' : ''}</span>
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {/* Total Summary Footer Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-gray-700">เกณฑ์การแปลผลคะแนนรวม (เต็ม 105 คะแนน):</span>
                    <p className="text-gray-500 text-[11px]">
                      ร้อยละ 80 ขึ้นไป = ดีเยี่ยม | 70-79 = ดีมาก | 60-69 = ปานกลาง | 50-59 = พอใช้ | ต่ำกว่า 50 = ปรับปรุง
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                    <div>คะแนนรวม: <strong className="text-primary text-sm">{currentTotal.total}</strong> / 105</div>
                    <div>ร้อยละ: <strong className="text-gray-900 text-sm">{currentTotal.percent}%</strong></div>
                    <div>ระดับ: <strong className="text-green-700 text-sm">{currentTotal.quality}</strong></div>
                  </div>
                </div>

                {/* Comments & Signature */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-gray-700">ความคิดเห็นและข้อเสนอแนะอื่นๆ:</label>
                  <textarea
                    rows={3}
                    value={currentComments}
                    onChange={(e) => setCurrentComments(e.target.value)}
                    placeholder="ระบุข้อเสนอแนะเพิ่มเติมเกี่ยวกับการปฏิบัติงาน หรือจุดที่นักเรียนทำได้ดีและควรพัฒนา..."
                    className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary resize-none"
                  />
                </div>



                {/* Save Buttons (No-print) */}
                <div className="no-print pt-4 border-t flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-gray-400">
                    ประเมินแล้ว {skillsStudents.filter(s => s.isEvaluated).length} จาก 43 คน
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveSkill(false)}
                      disabled={savingSkill}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-800 rounded-xl text-xs font-bold transition-all"
                    >
                      {savingSkill ? 'กำลังบันทึก...' : 'บันทึกคนนี้'}
                    </button>
                    <button
                      onClick={() => handleSaveSkill(true)}
                      disabled={savingSkill}
                      className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <Save size={15} /> {savingSkill ? 'กำลังบันทึก...' : 'บันทึกและไปคนถัดไป ▶'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              MODE 2: ตารางสรุปคะแนนทั้งชั้นเรียน (CLASS SUMMARY TABLE)
              ══════════════════════════════════════════════════════ */}
          {skillMode === 'table' && (
            <div className="space-y-6">
              {/* Summary Overview Cards */}
              {skillsSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
                  <div className="card p-4 border-l-4 border-primary">
                    <p className="text-[11px] text-gray-400 font-bold uppercase">ประเมินแล้ว</p>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {skillsSummary.evaluatedCount} <span className="text-xs font-normal text-gray-500">/ 43 คน</span>
                    </h3>
                  </div>
                  <div className="card p-4 border-l-4 border-blue-500">
                    <p className="text-[11px] text-blue-600 font-bold uppercase">คะแนนเฉลี่ยทั้งห้อง (X̄)</p>
                    <h3 className="text-2xl font-bold text-blue-600">
                      {skillsSummary.avgScore} <span className="text-xs font-normal text-gray-500">/ 105</span>
                    </h3>
                  </div>
                  <div className="card p-4 border-l-4 border-green-500">
                    <p className="text-[11px] text-green-600 font-bold uppercase">ร้อยละเฉลี่ย</p>
                    <h3 className="text-2xl font-bold text-green-600">
                      {skillsSummary.avgPercent}%
                    </h3>
                  </div>
                  <div className="card p-4 border-l-4 border-purple-500">
                    <p className="text-[11px] text-purple-600 font-bold uppercase">ระดับคุณภาพรวม</p>
                    <h3 className="text-xl font-bold text-purple-700">
                      {skillsSummary.overallQuality}
                    </h3>
                  </div>
                </div>
              )}

              {/* Class Summary Table */}
              <div className="printable-area bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="text-center space-y-1 pb-4 border-b border-gray-200">
                  <h2 className="text-base md:text-lg font-bold text-gray-900">
                    ตารางสรุปผลการประเมินทักษะการปฏิบัติงาน (รายวิชาโปรแกรมนำเสนอ ปวช.1)
                  </h2>
                  <p className="text-xs text-gray-600">
                    รอบการประเมิน: <strong>{assessmentType === 'pre' ? 'ก่อนจัดการเรียนรู้ (Pre-test)' : (assessmentType === 'post' ? 'หลังจัดการเรียนรู้ (Post-test)' : 'ตามกิจกรรม Challenge')}</strong> · นักเรียน 43 คน
                  </p>
                </div>

                {/* Filter */}
                <div className="no-print my-4 flex items-center justify-between">
                  <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ค้นหารหัส หรือ ชื่อนักเรียน..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <span className="text-xs text-gray-400">แสดง {filteredSkills.length} คน</span>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-xs text-left border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 text-center font-bold">
                        <th className="border border-gray-300 py-2.5 px-2 w-12">ลำดับ</th>
                        <th className="border border-gray-300 py-2.5 px-3 text-left w-28">รหัสนักเรียน</th>
                        <th className="border border-gray-300 py-2.5 px-4 text-left">รายชื่อ</th>
                        <th className="border border-gray-300 py-2.5 px-2 w-20">ด้านที่ 1<br/><span className="text-[10px] font-normal text-gray-500">(20)</span></th>
                        <th className="border border-gray-300 py-2.5 px-2 w-20">ด้านที่ 2<br/><span className="text-[10px] font-normal text-gray-500">(25)</span></th>
                        <th className="border border-gray-300 py-2.5 px-2 w-20">ด้านที่ 3<br/><span className="text-[10px] font-normal text-gray-500">(30)</span></th>
                        <th className="border border-gray-300 py-2.5 px-2 w-20">ด้านที่ 4<br/><span className="text-[10px] font-normal text-gray-500">(30)</span></th>
                        <th className="border border-gray-300 py-2.5 px-2 w-24 bg-primary/10 text-primary">คะแนนรวม<br/><span className="text-[10px] font-normal">(105)</span></th>
                        <th className="border border-gray-300 py-2.5 px-2 w-16">ร้อยละ</th>
                        <th className="border border-gray-300 py-2.5 px-2 w-24">ระดับคุณภาพ</th>
                        <th className="border border-gray-300 py-2.5 px-3 no-print w-24">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSkills.map((s, idx) => {
                        const scores = s.scores || {};
                        // คำนวณรายด้าน
                        const cat1 = ['1.1','1.2','1.3','1.4'].reduce((a, c) => a + (Number(scores[c]) || 0), 0);
                        const cat2 = ['2.1','2.2','2.3','2.4','2.5'].reduce((a, c) => a + (Number(scores[c]) || 0), 0);
                        const cat3 = ['3.1','3.2','3.3','3.4','3.5','3.6'].reduce((a, c) => a + (Number(scores[c]) || 0), 0);
                        const cat4 = ['4.1','4.2','4.3','4.4','4.5','4.6'].reduce((a, c) => a + (Number(scores[c]) || 0), 0);

                        return (
                          <tr key={s.studentId} className="hover:bg-slate-50 transition-colors">
                            <td className="border border-gray-300 py-2 px-2 text-center text-gray-600 font-medium">{s.orderNum}</td>
                            <td className="border border-gray-300 py-2 px-3 text-gray-600 font-mono text-[11px]">{s.studentCode}</td>
                            <td className="border border-gray-300 py-2 px-4 font-medium text-gray-800">{s.name}</td>
                            <td className="border border-gray-300 py-2 px-2 text-center">{s.isEvaluated ? cat1 : '-'}</td>
                            <td className="border border-gray-300 py-2 px-2 text-center">{s.isEvaluated ? cat2 : '-'}</td>
                            <td className="border border-gray-300 py-2 px-2 text-center">{s.isEvaluated ? cat3 : '-'}</td>
                            <td className="border border-gray-300 py-2 px-2 text-center">{s.isEvaluated ? cat4 : '-'}</td>
                            <td className="border border-gray-300 py-2 px-2 text-center font-bold text-primary bg-primary/5">
                              {s.isEvaluated ? s.totalScore : '-'}
                            </td>
                            <td className="border border-gray-300 py-2 px-2 text-center font-semibold text-gray-700">
                              {s.isEvaluated ? `${s.scorePercentage}%` : '-'}
                            </td>
                            <td className="border border-gray-300 py-2 px-2 text-center">
                              {s.isEvaluated ? (
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  s.qualityLevel === 'ดีเยี่ยม' ? 'text-green-700 bg-green-50' :
                                  s.qualityLevel === 'ดีมาก' ? 'text-blue-700 bg-blue-50' :
                                  s.qualityLevel === 'ปานกลาง' ? 'text-yellow-700 bg-yellow-50' :
                                  s.qualityLevel === 'พอใช้' ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
                                }`}>
                                  {s.qualityLevel}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px]">ยังไม่ประเมิน</span>
                              )}
                            </td>
                            <td className="border border-gray-300 py-2 px-3 no-print text-center">
                              <button
                                onClick={() => {
                                  setSelectedStudentIndex(idx);
                                  setSkillMode('form');
                                }}
                                className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold"
                              >
                                {s.isEvaluated ? 'แก้ไข' : 'ประเมิน'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>


              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
