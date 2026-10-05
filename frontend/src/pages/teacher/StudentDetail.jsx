import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Award, 
  FileText, 
  Users, 
  ClipboardCheck, 
  Key, 
  Trash2, 
  AlertTriangle, 
  X, 
  CheckCircle2 
} from 'lucide-react';
import api from '../../lib/api';

const RESET_OPTIONS = [
  { id: 'xp', label: 'แต้ม XP และเลเวล', icon: <Trophy size={18} className="text-amber-500" />, desc: 'ลบประวัติการรับ XP ทั้งหมด คืนค่าเป็น 0 XP (Level 1)' },
  { id: 'badges', label: 'เหรียญรางวัล (Badges)', icon: <Award size={18} className="text-purple-500" />, desc: 'ลบเหรียญรางวัลที่ได้รับทั้งหมด' },
  { id: 'submissions', label: 'ประวัติการส่งงานและคะแนน', icon: <FileText size={18} className="text-blue-500" />, desc: 'ลบไฟล์งาน, ลิงก์ Canva, คะแนน, ข้อเสนอแนะ, และมิชชันที่ทำ' },
  { id: 'group', label: 'กลุ่มที่สังกัด', icon: <Users size={18} className="text-emerald-500" />, desc: 'นำออกจากกลุ่ม และยกเลิกสถานะหัวหน้ากลุ่ม' },
  { id: 'assessments', label: 'ผลการประเมินวิจัย (พฤติกรรม & ทักษะ Canva)', icon: <ClipboardCheck size={18} className="text-indigo-500" />, desc: 'ลบข้อมูลแบบบันทึกพฤติกรรมการส่งงาน และแบบประเมินทักษะ Canva' },
  { id: 'password', label: 'รหัสผ่าน (คืนค่าเริ่มต้น)', icon: <Key size={18} className="text-orange-500" />, desc: 'รีเซ็ตรหัสผ่านกลับเป็นรหัสนักเรียน 11 หลัก' },
  { id: 'all', label: '💥 ล้างข้อมูลทุกรายการทั้งหมด (Full Reset)', icon: <Trash2 size={18} className="text-red-500" />, desc: 'รีเซ็ตข้อมูลทุกอย่างข้างต้นกลับเป็นค่าเริ่มต้นเหมือนนักเรียนใหม่' }
];

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reset modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('xp');
  const [resetting, setResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadStudentDetail = () => {
    setLoading(true);
    api.get(`/students/${id}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudentDetail();
  }, [id]);

  const handleExecuteReset = async () => {
    setResetting(true);
    try {
      const res = await api.post(`/students/${id}/reset`, { target: selectedTarget });
      setSuccessMessage(res.data.message || `ล้างค่า ${selectedTarget} เรียบร้อยแล้ว`);
      setModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadStudentDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการล้างค่า');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"/>
    </div>
  );
  
  if (!data) return <div className="card text-center py-12 text-gray-400">ไม่พบข้อมูลนักเรียน</div>;

  const { student, challenges = [], badges = [], xpLog = [], stats = {} } = data;

  const STATUS_CLS = { graded: 'text-success', submitted: 'text-blue-500', in_progress: 'text-warning', not_started: 'text-gray-400' };
  const STATUS_LABEL = { graded: 'ตรวจแล้ว', submitted: 'รอตรวจ', in_progress: 'กำลังทำ', not_started: 'ยังไม่เริ่ม' };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/teacher/students')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{student.name}</h1>
            <p className="text-gray-500 text-sm">{student.student_code || student.username} · {student.class_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          <button
            onClick={() => { setSelectedTarget('xp'); setModalOpen(true); }}
            className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <RotateCcw size={14} /> ล้างค่าข้อมูลนักเรียน
          </button>

          <div className="text-right border-l pl-4 border-gray-200">
            <p className="text-3xl font-bold text-primary">{student.xp || 0} <span className="text-base font-normal text-gray-400">XP</span></p>
            <p className="text-sm text-accent font-semibold">Lv.{student.level} {student.levelName}</p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium flex items-center justify-between animate-fade-in">
          <span className="flex items-center gap-2"><CheckCircle2 size={18} /> {successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800 text-xs">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'ทั้งหมด', value: stats.totalChallenges || 0, icon: <Trophy size={18} className="text-primary"/>, color: 'text-primary' },
          { label: 'เสร็จแล้ว', value: stats.completed || 0, icon: <CheckCircle size={18} className="text-success"/>, color: 'text-success' },
          { label: 'ตรงเวลา', value: stats.onTime || 0, icon: <Clock size={18} className="text-blue-500"/>, color: 'text-blue-500' },
          { label: 'ล่าช้า', value: stats.late || 0, icon: <XCircle size={18} className="text-danger"/>, color: 'text-danger' },
        ].map((s,i) => (
          <div key={i} className="card !p-4 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Challenge Progress */}
        <div className="card lg:col-span-2 space-y-3">
          <h3 className="font-bold text-lg">ความคืบหน้า Challenge</h3>
          {challenges.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">ยังไม่ได้เริ่ม Challenge ใดๆ</p>
          ) : (
            <div className="space-y-2">
              {challenges.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-gray-50 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{c.challenge_title}</p>
                    <p className="text-xs text-gray-400">
                      คะแนน: {c.score !== null ? `${c.score}/${c.max_score}` : 'ยังไม่ได้ตรวจ'}
                      {c.file_name && ` · ไฟล์: ${c.file_name}`}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold ${STATUS_CLS[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges & XP Log */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-lg mb-3">Badges</h3>
            {badges.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">ยังไม่มี Badge</p> : (
              <div className="flex flex-wrap gap-3">
                {badges.map(b => (
                  <div key={b.id} className="text-center" title={b.description}>
                    <p className="text-3xl">{b.icon}</p>
                    <p className="text-xs text-gray-500 mt-1 w-14 leading-tight">{b.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <h3 className="font-bold text-lg mb-3">XP ล่าสุด</h3>
            {xpLog.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">ยังไม่มีข้อมูล</p> : (
              <ul className="space-y-2">
                {xpLog.slice(0, 8).map(x => (
                  <li key={x.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1">{x.reason}</span>
                    <span className="font-bold text-success ml-2">+{x.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ─── RESET MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    ล้างค่าข้อมูล: {student.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    รหัสนักเรียน: {student.student_code || student.username}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                ข้อมูลที่ถูกล้างจะไม่สามารถกู้คืนได้ กรุณาเลือกรายการที่ต้องการล้างค่าอย่างระมัดระวัง
              </span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">เลือกรายการที่ต้องการล้างค่า:</label>
              {RESET_OPTIONS.map((opt) => {
                const isSelected = selectedTarget === opt.id;
                const isDanger = opt.id === 'all';
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedTarget(opt.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? (isDanger ? 'bg-red-50/80 border-red-300 ring-2 ring-red-400' : 'bg-primary/5 border-primary ring-2 ring-primary/40')
                        : 'bg-white border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <input
                        type="radio"
                        name="detail_reset_target"
                        checked={isSelected}
                        onChange={() => setSelectedTarget(opt.id)}
                        className={`w-4 h-4 cursor-pointer ${isDanger ? 'accent-red-600' : 'accent-primary'}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {opt.icon}
                        <span className={`text-xs font-bold ${isDanger ? 'text-red-700' : 'text-gray-800'}`}>
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={resetting}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={resetting}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
                  selectedTarget === 'all'
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                    : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-800/20'
                }`}
              >
                {resetting ? <>กำลังล้างค่า...</> : <><RotateCcw size={14} /> ยืนยันการล้างค่า</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
