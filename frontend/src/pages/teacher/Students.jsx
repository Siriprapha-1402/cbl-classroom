import React, { useEffect, useState } from 'react';
import { 
  Search, 
  ChevronRight, 
  Trophy, 
  Clock, 
  RotateCcw, 
  Trash2, 
  Key, 
  Users, 
  Award, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Check,
  ClipboardCheck,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const LEVEL_COLORS = ['bg-gray-200', 'bg-blue-200', 'bg-purple-200', 'bg-orange-200', 'bg-yellow-300'];

const RESET_OPTIONS = [
  { id: 'all_progress', label: '⚡ ล้างผลงานและคะแนนทั้งหมด (เก็บกลุ่มไว้)', icon: <RotateCcw size={18} className="text-amber-500" />, desc: 'รีเซ็ต XP, ประวัติส่งงาน, คะแนน, ความก้าวหน้า และเหรียญรางวัลกลับเป็น 0 (ค่าเริ่มต้น) โดยยังคงกลุ่มเดิมไว้' },
  { id: 'all', label: '💥 ล้างข้อมูลทุกรายการทั้งหมด (Full Reset รวมล้างกลุ่ม)', icon: <Trash2 size={18} className="text-red-500" />, desc: 'รีเซ็ตข้อมูลทุกอย่างข้างต้น รวมถึงนำนักเรียนออกจากกลุ่มทั้งหมด' },
  { id: 'submissions', label: 'ประวัติการส่งงานและคะแนน', icon: <FileText size={18} className="text-blue-500" />, desc: 'ลบไฟล์งาน, ลิงก์ Canva, คะแนน, ข้อเสนอแนะ, และมิชชันที่ทำ' },
  { id: 'xp', label: 'แต้ม XP และเลเวล', icon: <Trophy size={18} className="text-amber-500" />, desc: 'ลบประวัติการรับ XP ทั้งหมด คืนค่าเป็น 0 XP (Level 1)' },
  { id: 'badges', label: 'เหรียญรางวัล (Badges)', icon: <Award size={18} className="text-purple-500" />, desc: 'ลบเหรียญรางวัลที่ได้รับทั้งหมด' },
  { id: 'group', label: 'กลุ่มที่สังกัด', icon: <Users size={18} className="text-emerald-500" />, desc: 'นำออกจากกลุ่ม และยกเลิกสถานะหัวหน้ากลุ่ม' },
  { id: 'assessments', label: 'ผลการประเมินวิจัย (พฤติกรรม & ทักษะ Canva)', icon: <ClipboardCheck size={18} className="text-indigo-500" />, desc: 'ลบข้อมูลแบบบันทึกพฤติกรรมการส่งงาน และแบบประเมินทักษะ Canva' },
  { id: 'password', label: 'รหัสผ่าน (คืนค่าเริ่มต้น)', icon: <Key size={18} className="text-orange-500" />, desc: 'รีเซ็ตรหัสผ่านกลับเป็นรหัสนักเรียน 11 หลัก' }
];

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Reset Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('single'); // 'single' | 'batch' | 'class'
  const [targetStudent, setTargetStudent] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState('all_progress');
  const [resetting, setResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadStudents = async () => {
    try {
      const r = await api.get('/students');
      setStudents(r.data.students || []);
      setFiltered(r.data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();

    let bc;
    try {
      bc = new BroadcastChannel('cbl_channel');
      bc.onmessage = () => loadStudents();
    } catch (e) {}

    const handleSync = (e) => {
      if (!e?.key || e.key.startsWith('cbl_mock_db')) loadStudents();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('cbl_storage_update', handleSync);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('cbl_storage_update', handleSync);
    };
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.student_code?.includes(q) ||
      s.username?.includes(q)
    ));
  }, [search, students]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Open reset modals
  const openSingleReset = (student) => {
    setTargetStudent(student);
    setModalMode('single');
    setSelectedTarget('all_progress');
    setModalOpen(true);
  };

  const openBatchReset = () => {
    if (selectedIds.length === 0) return;
    setModalMode('batch');
    setSelectedTarget('all_progress');
    setModalOpen(true);
  };

  const openClassReset = () => {
    setModalMode('class');
    setSelectedTarget('all_progress');
    setModalOpen(true);
  };

  // Confirm Reset Execution
  const handleExecuteReset = async () => {
    setResetting(true);
    try {
      if (modalMode === 'single' && targetStudent) {
        const res = await api.post(`/students/${targetStudent.id}/reset`, { target: selectedTarget });
        setSuccessMessage(res.data.message || `ล้างค่า ${selectedTarget} เรียบร้อยแล้ว`);
      } else if (modalMode === 'batch') {
        const res = await api.post('/students/reset-batch', { studentIds: selectedIds, target: selectedTarget });
        setSuccessMessage(res.data.message || `ล้างค่าให้นักเรียนที่เลือก (${selectedIds.length} คน) เรียบร้อยแล้ว`);
        setSelectedIds([]);
      } else if (modalMode === 'class') {
        const res = await api.post('/students/reset-class', { target: selectedTarget });
        setSuccessMessage(res.data.message || 'ล้างค่าข้อมูลของทั้งห้องเรียบร้อยแล้ว');
        setSelectedIds([]);
      }

      setModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 4000);
      
      // Dispatch sync events across open tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cbl_storage_update'));
        try {
          const bc = new BroadcastChannel('cbl_channel');
          bc.postMessage({ type: 'UPDATED' });
          bc.close();
        } catch (e) {}
      }

      await loadStudents();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">รายชื่อนักเรียน</h1>
          <p className="text-gray-500 mt-1">ทั้งหมด {students.length} คน · ปวช.1</p>
        </div>

        {/* Global Reset Buttons */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={openBatchReset}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all animate-fade-in"
            >
              <RotateCcw size={14} /> ล้างค่าที่เลือก ({selectedIds.length} คน)
            </button>
          )}

          <button
            onClick={openClassReset}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="ล้างค่าข้อมูลนักเรียนทั้งห้องพร้อมกัน"
          >
            <RotateCcw size={14} className="text-rose-400" /> ล้างค่าข้อมูล (ทั้งห้อง)
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium flex items-center justify-between animate-fade-in">
          <span className="flex items-center gap-2"><CheckCircle2 size={18} /> {successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800 text-xs">✕</button>
        </div>
      )}

      {/* Search & Selection info bar */}
      <div className="card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
          <input 
            type="text" 
            placeholder="ค้นหาชื่อหรือรหัสนักเรียน..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:border-primary outline-none text-xs font-medium"
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {selectedIds.length > 0 ? (
            <span className="text-primary font-bold">
              เลือกอยู่ {selectedIds.length} จาก {filtered.length} คน
            </span>
          ) : (
            <span>แสดง {filtered.length} จาก {students.length} คน</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                  title="เลือกทุกคน"
                />
              </th>
              <th className="p-4 text-center text-gray-600 w-14">ลำดับ</th>
              <th className="p-4 text-gray-600">รหัสนักเรียน</th>
              <th className="p-4 text-gray-600">ชื่อ-สกุล</th>
              <th className="p-4 text-center text-gray-600">กลุ่ม</th>
              <th className="p-4 text-center text-gray-600">เลเวล</th>
              <th className="p-4 text-center text-gray-600">XP</th>
              <th className="p-4 text-center text-gray-600">ส่งงาน</th>
              <th className="p-4 text-center text-gray-600">ตรงเวลา %</th>
              <th className="p-4 text-center text-gray-600 w-36">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-gray-400">ไม่พบนักเรียน</td></tr>
            ) : filtered.map((s, idx) => {
              const isSelected = selectedIds.includes(s.id);
              return (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(s.id)}
                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                  </td>
                  <td className="p-4 text-center font-bold text-gray-400 text-xs">
                    {s.orderNum || (idx + 1)}
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-500 font-semibold">{s.student_code || s.username}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-gray-700 ${LEVEL_COLORS[Math.min((s.level||1)-1, 4)]}`}>
                        {s.name?.charAt(s.name.lastIndexOf(' ')+1) || (idx+1)}
                      </div>
                      <span className="font-medium text-gray-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-gray-600">{s.group_name || '—'}</td>
                  <td className="p-4 text-center">
                    <span className="font-bold text-accent">Lv.{s.level || 1}</span>
                    <p className="text-xs text-gray-400">{s.levelName || 'Beginner'}</p>
                  </td>
                  <td className="p-4 text-center font-semibold text-primary">{s.xp || 0}</td>
                  <td className="p-4 text-center text-gray-700">{s.completed_count || 0}</td>
                  <td className="p-4 text-center">
                    <span className={`font-semibold ${(s.onTimeRate||0) >= 80 ? 'text-success' : (s.onTimeRate||0) >= 50 ? 'text-warning' : 'text-danger'}`}>
                      {s.onTimeRate || 0}%
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => navigate(`/teacher/students/${s.id}`)}
                        className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-xs font-medium flex items-center gap-1"
                        title="ดูรายละเอียดผลงานของนักเรียน"
                      >
                        ดู <ChevronRight size={12}/>
                      </button>

                      <button
                        onClick={() => openSingleReset(s)}
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-rose-200 transition-colors"
                        title="ล้างค่าข้อมูลของนักเรียนคนนี้"
                      >
                        <RotateCcw size={12}/> ล้างค่า
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: เลือกล้างค่าข้อมูล (RESET MODAL)
          ═══════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {modalMode === 'single' && `ล้างค่าข้อมูล: ${targetStudent?.name}`}
                    {modalMode === 'batch' && `ล้างค่าข้อมูลให้นักเรียนที่เลือก (${selectedIds.length} คน)`}
                    {modalMode === 'class' && 'ล้างค่าข้อมูลนักเรียนทั้งห้อง (43 คน)'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {modalMode === 'single' && `รหัสนักเรียน: ${targetStudent?.student_code || targetStudent?.username}`}
                    {modalMode === 'batch' && `จะดำเนินการกับนักเรียนจำนวน ${selectedIds.length} คนที่เลือก`}
                    {modalMode === 'class' && 'จะดำเนินการกับนักเรียนทุกคนในห้อง ปวช.1/1'}
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

            {/* Warning Message */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                ข้อมูลที่ถูกล้างจะไม่สามารถกู้คืนได้ กรุณาเลือกรายการที่ต้องการล้างค่าอย่างระมัดระวัง
              </span>
            </div>

            {/* Reset Target Options List */}
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
                        name="reset_target"
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

            {/* Modal Actions */}
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
                  (selectedTarget === 'all' || selectedTarget === 'all_progress')
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-800/20'
                }`}
              >
                {resetting ? (
                  <>กำลังล้างค่า...</>
                ) : (
                  <>
                    <RotateCcw size={14} /> ยืนยันการล้างค่า
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
