import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Save, ExternalLink, CheckSquare, ListChecks, Users, CheckCircle2, Circle, AlertCircle, ClipboardCheck } from 'lucide-react';
import api from '../../lib/api';

export default function GradeFeedback() {
  const navigate = useNavigate();
  const { id } = useParams(); // student_challenge id
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [applyToGroup, setApplyToGroup] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.get(`/grade/${id}`);
      setData(res.data);
      if (score === '') {
        setScore(res.data.grade?.score ?? '');
      }
      if (feedback === '') {
        setFeedback(res.data.grade?.comment || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Checklist toggle by teacher
  const handleTeacherChecklistToggle = async (itemId) => {
    if (!data) return;
    // Optimistic UI update
    const updatedChecklist = data.checklist.map(item =>
      item.id === itemId ? { ...item, checked: item.checked ? 0 : 1 } : item
    );
    setData(prev => ({ ...prev, checklist: updatedChecklist }));

    // Recalculate auto score
    const checkedCount = updatedChecklist.filter(c => c.checked).length;
    const maxScore = data.submission?.max_score || 100;
    const newAuto = Math.round((checkedCount / updatedChecklist.length) * maxScore);
    setScore(newAuto);

    try {
      await api.post('/checklists/teacher/toggle', {
        itemId,
        studentChallengeId: id,
        applyToGroup,
      });
    } catch (err) {
      console.error(err);
      loadData(); // Revert on error
    }
  };

  // Checklist batch (all / none)
  const handleTeacherChecklistBatch = async (checkAll) => {
    if (!data || data.checklist.length === 0) return;
    setActionLoading(true);
    const updatedChecklist = data.checklist.map(item => ({ ...item, checked: checkAll ? 1 : 0 }));
    setData(prev => ({ ...prev, checklist: updatedChecklist }));

    const maxScore = data.submission?.max_score || 100;
    setScore(checkAll ? maxScore : 0);

    try {
      await api.post('/checklists/teacher/batch', {
        studentChallengeId: id,
        checkAll,
        applyToGroup,
      });
    } catch (err) {
      console.error(err);
      loadData();
    } finally {
      setActionLoading(false);
    }
  };

  // Mission toggle by teacher
  const handleTeacherMissionToggle = async (missionId) => {
    if (!data) return;
    const updatedMissions = data.missions.map(m => {
      if (m.id === missionId) {
        const nextStatus = m.progress_status === 'completed' ? 'in_progress' : 'completed';
        return { ...m, progress_status: nextStatus };
      }
      return m;
    });
    setData(prev => ({ ...prev, missions: updatedMissions }));

    try {
      await api.post('/missions/teacher/toggle', {
        missionId,
        studentChallengeId: id,
        applyToGroup,
      });
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  // Mission batch by teacher
  const handleTeacherMissionBatch = async (completeAll) => {
    if (!data || data.missions.length === 0) return;
    setActionLoading(true);
    const updatedMissions = data.missions.map(m => ({
      ...m,
      progress_status: completeAll ? 'completed' : 'in_progress'
    }));
    setData(prev => ({ ...prev, missions: updatedMissions }));

    try {
      await api.post('/missions/teacher/batch', {
        studentChallengeId: id,
        completeAll,
        applyToGroup,
      });
    } catch (err) {
      console.error(err);
      loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSave = async () => {
    if (score === '' || score < 0) { alert('กรุณากรอกคะแนน'); return; }
    setSaving(true);
    try {
      await api.post(`/grade/${id}`, {
        score: Number(score),
        comment: feedback,
        applyToGroup,
      });
      setSaved(true);
      setTimeout(() => navigate('/teacher/submissions'), 1200);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"/></div>;
  if (!data) return <div className="card text-center py-12 text-gray-400">ไม่พบข้อมูล</div>;

  const { submission, student, checklist = [], missions = [] } = data;
  const maxScore = submission?.max_score || 100;
  const checkedCount = checklist.filter(c => c.checked).length;
  const completedMissionsCount = missions.filter(m => m.progress_status === 'completed').length;
  const hasGroup = !!student?.group_id;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><ArrowLeft size={20}/></button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              ตรวจและเช็คงาน — {student?.name}
              {hasGroup && (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-semibold">
                  <Users size={12}/> {student.group_name}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-400">
              รหัสนักเรียน: {student?.student_code || student?.username} · {submission?.challenge_title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/teacher/assessments')}
            className="px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold border border-purple-200 flex items-center gap-1.5 transition-all shadow-2xs"
            title="เปิดทำแบบประเมินทักษะการปฏิบัติงาน Canva และแบบบันทึกพฤติกรรม"
          >
            <ClipboardCheck size={15}/> ทำแบบประเมินวิจัย (Rubric 4 ด้าน)
          </button>

          {/* Group Sync Checkbox */}
          {hasGroup && (
            <label className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl cursor-pointer text-xs font-semibold text-purple-800 hover:bg-purple-100/60 transition-colors">
              <input
                type="checkbox"
                checked={applyToGroup}
                onChange={e => setApplyToGroup(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
              <span>ตรวจและเช็คให้ทุกคนในกลุ่ม ({student.groupMembers?.length || 0} คน)</span>
            </label>
          )}
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-center font-medium text-sm">
          ✅ บันทึกคะแนนและผลการตรวจเรียบร้อย! กำลังกลับ...
        </div>
      )}

      {/* Group Members Preview (if group) */}
      {hasGroup && student.groupMembers?.length > 0 && (
        <div className="bg-purple-50/50 border border-purple-150 rounded-2xl p-3 text-xs text-purple-900 flex items-center gap-2 flex-wrap">
          <span className="font-bold flex items-center gap-1"><Users size={13}/> สมาชิกในกลุ่ม:</span>
          {student.groupMembers.map(m => (
            <span key={m.id} className="bg-white border border-purple-200 px-2 py-0.5 rounded-lg text-purple-800">
              {m.name} ({m.student_code || m.id})
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Submission info + Missions + Checklist */}
        <div className="space-y-4">

          {/* Submission Info & Links */}
          <div className="card space-y-3 text-sm">
            <h3 className="font-bold text-gray-700 flex items-center gap-1.5">
              <span>📤</span> ข้อมูลการส่งงาน
            </h3>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">เวลาส่ง</span>
              <span className="font-medium text-gray-700">
                {submission?.submitted_at ? new Date(submission.submitted_at).toLocaleString('th-TH', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : 'ยังไม่ได้กดส่งงานสุดท้าย'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">สถานะการส่ง</span>
              <span className={`font-semibold px-2 py-0.5 rounded-md text-xs ${submission?.submission_status === 'late' ? 'bg-red-100 text-red-600' : submission?.submitted_at ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {submission?.submission_status === 'late' ? '⚠ ล่าช้า' : submission?.submitted_at ? '✅ ตรงเวลา' : 'กำลังทำ'}
              </span>
            </div>

            {/* Canva Link Button */}
            {submission?.canva_link && (
              <a
                href={submission.canva_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-gradient-to-r from-[#7C5CBF] to-[#00C4CC] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all text-xs mt-2"
              >
                <ExternalLink size={14}/> เปิดดูผลงาน Canva ของนักเรียน
              </a>
            )}

            {/* Attached File */}
            {submission?.file_name && (
              <div className="flex items-center gap-3 p-2.5 bg-gray-50 border rounded-xl">
                <FileText size={18} className="text-primary flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate text-xs">{submission.file_name}</p>
                </div>
                <a
                  href={`http://localhost:5000/uploads/${submission.file_path?.split('/').pop() || submission.file_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                >
                  <ExternalLink size={13}/>
                </a>
              </div>
            )}
          </div>

          {/* ─── 1. CHECKLIST SECTION (ครูเป็นคนติ๊ก) ─── */}
          <div className="card space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <CheckSquare size={16} className="text-primary"/> ตรวจเกณฑ์ Checklist ({checkedCount}/{checklist.length})
                </h3>
                <p className="text-[11px] text-gray-400">ครูคลิกเพื่อติ๊กผ่านหรือยกเลิกแต่ละข้อ</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={actionLoading || checklist.length === 0}
                  onClick={() => handleTeacherChecklistBatch(true)}
                  className="px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold border border-green-200"
                >
                  ✓ ติ๊กทั้งหมด
                </button>
                <button
                  type="button"
                  disabled={actionLoading || checklist.length === 0}
                  onClick={() => handleTeacherChecklistBatch(false)}
                  className="px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold border border-gray-200"
                >
                  ☐ ล้าง
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {checklist.length > 0 && (
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((checkedCount / checklist.length) * 100)}%` }}
                />
              </div>
            )}

            {checklist.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-3">ไม่มีรายการ Checklist สำหรับกิจกรรมนี้</p>
            ) : (
              <div className="space-y-2">
                {checklist.map((c, i) => (
                  <div
                    key={c.id}
                    onClick={() => handleTeacherChecklistToggle(c.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      c.checked
                        ? 'bg-green-50/90 border-green-200 text-green-900 shadow-xs'
                        : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={!!c.checked}
                        onChange={() => {}}
                        className="w-4 h-4 accent-green-600 rounded cursor-pointer"
                      />
                      <span className={`text-xs ${c.checked ? 'font-medium' : ''}`}>
                        {i + 1}. {c.item_text}
                      </span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                      c.checked ? 'bg-green-200/80 text-green-800' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {c.checked ? '✓ ผ่านแล้ว' : 'ยังไม่ผ่าน'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── 2. MISSIONS SECTION (ครูตรวจขั้นตอน) ─── */}
          <div className="card space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <ListChecks size={16} className="text-blue-600"/> ตรวจขั้นตอนการทำ (Missions) ({completedMissionsCount}/{missions.length})
                </h3>
                <p className="text-[11px] text-gray-400">เช็คความถูกต้องของขั้นตอนการทำงาน</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={actionLoading || missions.length === 0}
                  onClick={() => handleTeacherMissionBatch(true)}
                  className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200"
                >
                  ✓ ผ่านทุกขั้นตอน
                </button>
                <button
                  type="button"
                  disabled={actionLoading || missions.length === 0}
                  onClick={() => handleTeacherMissionBatch(false)}
                  className="px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold border border-gray-200"
                >
                  ☐ ล้าง
                </button>
              </div>
            </div>

            {missions.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-3">ไม่มีขั้นตอนที่กำหนด</p>
            ) : (
              <div className="space-y-2">
                {missions.map((m, i) => {
                  const isDone = m.progress_status === 'completed';
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start justify-between p-2.5 rounded-xl border transition-all ${
                        isDone ? 'bg-blue-50/70 border-blue-200' : 'bg-white border-gray-150'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                          isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {isDone ? '✓' : i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold ${isDone ? 'text-blue-900' : 'text-gray-700'}`}>
                            {m.title}
                          </p>
                          {m.description && <p className="text-[11px] text-gray-500 mt-0.5">{m.description}</p>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTeacherMissionToggle(m.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ml-2 flex-shrink-0 transition-all ${
                          isDone
                            ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200/60'
                            : 'bg-primary text-white hover:bg-primary/90 shadow-xs'
                        }`}
                      >
                        {isDone ? '✓ ครูเช็คผ่านแล้ว' : 'ให้ผ่าน'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Score + Feedback */}
        <div className="space-y-4">
          <div className="card space-y-4 sticky top-4">
            <h3 className="font-bold text-gray-700 flex items-center justify-between">
              <span>⭐ ให้คะแนน & ข้อเสนอแนะ</span>
              {checklist.length > 0 && (
                <span className="text-xs font-normal text-primary">
                  💡 แนะนำจาก Checklist: {Math.round((checkedCount / checklist.length) * maxScore)}/{maxScore}
                </span>
              )}
            </h3>

            <div className="text-center p-4 bg-gray-50/80 rounded-2xl border border-gray-150">
              <input
                type="number"
                min={0}
                max={maxScore}
                value={score}
                onChange={e => setScore(e.target.value)}
                className="text-5xl font-bold text-primary text-center w-full border-b-2 border-primary/50 focus:border-primary pb-2 outline-none bg-transparent"
              />
              <p className="text-gray-400 text-xs mt-2 font-medium">คะแนนเต็ม {maxScore} คะแนน</p>
            </div>

            {/* Quick score buttons */}
            <div className="flex gap-1.5 flex-wrap justify-center">
              {[50, 60, 70, 80, 90, 100].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScore(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    Number(score) === s
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary bg-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Feedback / ความคิดเห็นจากครู</label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={5}
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-xs leading-relaxed resize-none bg-gray-50/40 focus:bg-white transition-colors"
                placeholder="เขียนข้อเสนอแนะให้นักเรียน เช่น จุดเด่น ชิ้นงานทำได้ดีในส่วนใด หรือส่วนที่ควรปรับปรุงเพิ่มเติม..."
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="w-full btn-primary py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50 shadow-md shadow-primary/20"
            >
              <Save size={16}/> {saving ? 'กำลังบันทึกคะแนน...' : saved ? '✅ บันทึกแล้ว' : 'บันทึกผลการตรวจและคะแนน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
