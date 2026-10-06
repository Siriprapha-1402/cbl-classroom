import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckSquare, ExternalLink, Send, Clock, Users, Link2, Edit3, Crown, CheckCircle, Award, Star } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { resolveStudentGroup } from '../../lib/groupHelper';

function Timer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    if (!deadline) return;
    const update = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) { setTimeLeft('หมดเวลาแล้ว'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 3600000);
      setTimeLeft(`${h > 0 ? h + 'ชม. ' : ''}${m}นาที ${s}วิ`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [deadline]);
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${urgent ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
      <Clock size={14}/> {timeLeft || '—'}
    </div>
  );
}

export default function ChallengeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('missions');
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState('');
  const [myGroup, setMyGroup] = useState(null);

  // Group Canva Link state
  const [groupCanvaInfo, setGroupCanvaInfo] = useState(null); // { link, groupName, setByName, hasGroup }
  const [showSetLink, setShowSetLink] = useState(false);
  const [newCanvaLink, setNewCanvaLink] = useState('');
  const [settingLink, setSettingLink] = useState(false);

  const heartbeatRef = useRef(null);

  const loadGroupCanva = useCallback(async () => {
    const res = await api.get(`/groups/canva-link/${id}`).catch(() => null);
    if (res) setGroupCanvaInfo(res.data);
  }, [id]);

  const load = useCallback(async () => {
    const [cRes, gRes] = await Promise.all([
      api.get(`/challenges/${id}`),
      api.get('/groups'),
    ]);
    setData(cRes.data);
    const resolvedGrp = resolveStudentGroup(gRes.data, user);
    setMyGroup(resolvedGrp);
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    load();
    loadGroupCanva();

    let bc;
    try {
      bc = new BroadcastChannel('cbl_channel');
      bc.onmessage = () => {
        load();
        loadGroupCanva();
      };
    } catch (e) {}

    const handleSync = (e) => {
      if (!e?.key || e.key === 'cbl_mock_db_clean_v6') {
        load();
        loadGroupCanva();
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('cbl_storage_update', handleSync);

    // Live sync polling every 4 seconds
    const interval = setInterval(() => {
      load();
      loadGroupCanva();
    }, 4000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('cbl_storage_update', handleSync);
      clearInterval(interval);
    };
  }, [load, loadGroupCanva]);

  // Heartbeat — ping real-time active working status every 8 seconds
  useEffect(() => {
    if (!id) return;
    const ping = () => {
      api.post('/groups/heartbeat', { 
        challengeId: Number(id), 
        studentChallengeId: data?.studentProgress?.id || null 
      }).catch(() => {});
    };
    ping();
    heartbeatRef.current = setInterval(ping, 8000);
    return () => clearInterval(heartbeatRef.current);
  }, [id, data?.studentProgress?.id]);

  const handleStart = async () => {
    setStarting(true);
    await api.post(`/challenges/${id}/start`).catch(console.error);
    await load();
    setStarting(false);
  };

  const handleMissionComplete = async (missionId) => {
    await api.post(`/missions/${missionId}/complete`).catch(console.error);
    load();
  };

  const handleChecklistToggle = async (itemId) => {
    await api.post(`/checklists/${itemId}/toggle`).catch(console.error);
    load();
  };

  // เปิด Canva — ใช้ลิงก์กลุ่ม ถ้ามี ไม่งั้นไป canva.com
  const handleOpenCanva = () => {
    const link = groupCanvaInfo?.link;
    if (link) {
      window.open(link, '_blank');
    } else {
      // เปิด Canva แล้วขอให้ตั้งลิงก์
      window.open('https://www.canva.com', '_blank');
      setShowSetLink(true);
    }
  };

  // ตั้งลิงก์ Canva ของกลุ่ม
  const handleSetGroupLink = async () => {
    if (!newCanvaLink.trim()) return;
    setSettingLink(true);
    const res = await api.post(`/groups/canva-link/${id}`, { canvaLink: newCanvaLink.trim() }).catch(e => {
      alert(e.response?.data?.error || 'เกิดข้อผิดพลาด'); return null;
    });
    if (res) {
      await loadGroupCanva();
      setShowSetLink(false);
      setNewCanvaLink('');
    }
    setSettingLink(false);
  };

  const handleSubmitLink = async () => {
    const submitLink = groupCanvaInfo?.link;
    if (!submitLink) { alert('กรุณาตั้งลิงก์ Canva ของกลุ่มก่อน'); return; }
    setSubmitting(true);
    await api.post(`/challenges/${id}/submit-link`, { canvaLink: submitLink, note }).catch(console.error);
    await load();
    setSubmitting(false);
    navigate(`/student/challenges/${id}/summary`);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"/></div>;
  if (!data) return <div className="card text-center py-12 text-gray-400">ไม่พบกิจกรรม</div>;

  const { challenge, missions = [], checklistItems = [], studentProgress: sc } = data;
  const missionProgress = sc?.missionProgress || [];
  const checklistCompletions = sc?.checklistCompletions || [];
  const isStarted = !!sc;
  const isSubmitted = sc?.status === 'submitted' || sc?.status === 'graded';
  const checkedCount = checklistCompletions.filter(c => c.checked).length;
  const getMissionStatus = (m) => missionProgress.find(p => p.mission_id === m.id)?.status || 'locked';
  const getCheckStatus = (item) => checklistCompletions.find(c => c.checklist_item_id === item.id)?.checked;

  const completedMissionsCount = missions.filter(m => getMissionStatus(m) === 'completed').length;

  const tabs = [
    { id: 'missions', label: `ขั้นตอน (${completedMissionsCount}/${missions.length})` },
    { id: 'checklist', label: `Checklist (${checkedCount}/${checklistItems.length})` },
    { id: 'submit', label: isSubmitted ? '✅ ส่งแล้ว' : '📤 ส่งงาน' },
  ];

  // Group status computation
  const hasGroup = !!(myGroup || groupCanvaInfo?.hasGroup);
  const currentGroupName = myGroup?.name || groupCanvaInfo?.groupName || 'กลุ่มของฉัน';
  const currentGroupMembers = myGroup?.members || groupCanvaInfo?.members || [];

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-start gap-2">
        <button onClick={() => navigate('/student/home')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 flex-shrink-0"><ArrowLeft size={18}/></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{challenge.title}</h1>
          {hasGroup && (
            <span className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mt-1 font-semibold">
              <Users size={12}/> {currentGroupName} ({currentGroupMembers.length} คน)
              <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full">อยู่ในกลุ่มแล้ว ✅</span>
            </span>
          )}
        </div>
        <Timer deadline={challenge.deadline}/>
      </div>

      {/* Prominent Group Card */}
      {hasGroup ? (
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border-2 border-primary/30 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                <Users size={16}/>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800 text-sm">{currentGroupName}</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full">
                    อยู่ในกลุ่มแล้ว ✅
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  สมาชิกในกลุ่ม {currentGroupMembers.length} คน {myGroup?.leader_id && '· 👑 มีหัวหน้ากลุ่ม'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/student/groups')}
              className="text-xs text-primary hover:underline font-semibold"
            >
              ดูสมาชิกกลุ่ม →
            </button>
          </div>

          {currentGroupMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-primary/10">
              {currentGroupMembers.map(m => (
                <span key={m.id} className="text-xs bg-white/95 border border-primary/20 px-2.5 py-1 rounded-full text-gray-700 font-medium flex items-center gap-1 shadow-xs">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                    {m.name?.charAt(0)}
                  </span>
                  {m.name} {myGroup?.leader_id === m.id && <Crown size={11} className="text-amber-500"/>}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <p className="text-sm font-bold text-amber-800">⚠️ คุณยังไม่ได้อยู่ในกลุ่ม</p>
            <p className="text-xs text-amber-600 mt-0.5">กรุณาเลือกหรือสร้างกลุ่มก่อน เพื่อทำงานและส่งผลงานร่วมกับเพื่อน</p>
          </div>
          <button 
            onClick={() => navigate('/student/groups')}
            className="btn-primary text-xs px-4 py-2 rounded-xl whitespace-nowrap"
          >
            ไปที่หน้าจัดกลุ่ม →
          </button>
        </div>
      )}

      {/* Start Banner */}
      {!isStarted && (
        <div className="card bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 text-center py-8">
          <p className="text-5xl mb-3">🚀</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">พร้อมเริ่มแล้วหรือยัง?</h2>
          {!hasGroup && (
            <p className="text-orange-500 text-sm mb-3">
              ⚠️ แนะนำให้เข้ากลุ่มก่อน —{' '}
              <button className="underline font-semibold" onClick={() => navigate('/student/groups')}>คลิกที่นี่</button>
            </p>
          )}
          <button onClick={handleStart} disabled={starting} className="btn-primary px-10 py-3 text-lg disabled:opacity-60">
            {starting ? 'กำลังเริ่ม...' : '🎯 เริ่มทำกิจกรรม'}
          </button>
        </div>
      )}

      {/* Scenario */}
      {challenge.scenario && (
        <div className="card bg-blue-50 border border-blue-100 !p-4">
          <h3 className="font-bold text-blue-900 text-sm mb-1">📜 โจทย์</h3>
          <p className="text-blue-800 text-sm whitespace-pre-line">{challenge.scenario}</p>
        </div>
      )}

      {/* ─── CANVA SECTION ─── */}
      {isStarted && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="text-lg">🎨</span> Canva ของกลุ่ม {hasGroup && <span className="text-primary text-sm font-semibold">({currentGroupName})</span>}
            </h3>
            {groupCanvaInfo?.link && (
              <button onClick={() => { setNewCanvaLink(groupCanvaInfo.link); setShowSetLink(true); }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary px-2 py-1 rounded-lg hover:bg-gray-100">
                <Edit3 size={12}/> เปลี่ยนลิงก์
              </button>
            )}
          </div>

          {/* ลิงก์กลุ่มมีแล้ว */}
          {groupCanvaInfo?.link && !showSetLink && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle size={14}/> เชื่อมต่อลิงก์ Canva กลุ่มแล้ว
                </span>
                <span className="text-[11px] text-emerald-600">พร้อมทำงานร่วมกัน</span>
              </div>
              <p className="text-xs text-gray-600 truncate font-mono bg-white p-2 rounded-lg border border-emerald-100">
                {groupCanvaInfo.link}
              </p>
              <button onClick={handleOpenCanva}
                className="w-full py-2.5 bg-gradient-to-r from-[#7C5CBF] to-[#00C4CC] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow hover:shadow-md transition-all">
                <ExternalLink size={15}/> 🚀 เปิด Canva ของกลุ่ม
              </button>
            </div>
          )}

          {/* ถ้ายังไม่มีลิงก์กลุ่ม */}
          {!groupCanvaInfo?.link && !showSetLink && (
            <div className="space-y-2">
              {!hasGroup && (
                <p className="text-xs text-orange-500 bg-orange-50 p-2.5 rounded-xl border border-orange-200">
                  ⚠️ คุณยังไม่ได้อยู่ในกลุ่ม — <button className="underline font-bold" onClick={() => navigate('/student/groups')}>เข้ากลุ่มก่อน</button>
                </p>
              )}
              {hasGroup && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                  <span>✅</span> <span>คุณอยู่ใน <b>{currentGroupName}</b> เรียบร้อยแล้ว</span>
                </p>
              )}
              <p className="text-sm text-gray-500">
                {hasGroup
                  ? `กลุ่ม "${currentGroupName}" ยังไม่มีลิงก์ Canva — เปิด Canva สร้าง Slide แล้วนำ Share Link มาวางที่นี่เพื่อทำงานร่วมกัน`
                  : 'เปิด Canva สร้าง Slide แล้วแชร์ลิงก์ให้คนในกลุ่ม'}
              </p>
              <button onClick={handleOpenCanva}
                className="w-full py-3 bg-gradient-to-r from-[#7C5CBF] to-[#00C4CC] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow hover:shadow-lg transition-all">
                <ExternalLink size={17}/> เปิด Canva เพื่อเริ่มสร้างงาน
              </button>
              {hasGroup && (
                <button onClick={() => setShowSetLink(true)}
                  className="w-full py-2.5 border-2 border-dashed border-[#7C5CBF]/40 text-[#7C5CBF] rounded-xl text-sm font-semibold hover:bg-[#7C5CBF]/5">
                  <Link2 size={14} className="inline mr-1"/> วาง Canva Share Link ของกลุ่ม
                </button>
              )}
            </div>
          )}

          {/* Form ตั้งลิงก์ */}
          {showSetLink && (
            <div className="space-y-2 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <p className="text-xs font-semibold text-purple-700">📋 วาง Share Link จาก Canva (ลิงก์นี้จะใช้ร่วมกันทั้งกลุ่ม)</p>
              <input
                className="w-full p-2.5 rounded-xl border border-purple-300 text-sm outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                placeholder="https://www.canva.com/design/..."
                value={newCanvaLink} autoFocus
                onChange={e => setNewCanvaLink(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetGroupLink()}
              />
              <div className="flex gap-2">
                <button onClick={handleSetGroupLink} disabled={settingLink || !newCanvaLink.trim()}
                  className="flex-1 py-2 bg-[#7C5CBF] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                  {settingLink ? 'กำลังบันทึก...' : '✅ ตั้งลิงก์กลุ่ม'}
                </button>
                <button onClick={() => { setShowSetLink(false); setNewCanvaLink(''); }}
                  className="px-4 py-2 border rounded-xl text-gray-500 text-sm">
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {/* ถ้ามีลิงก์กลุ่มแล้ว */}
          {groupCanvaInfo?.link && !showSetLink && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                <Link2 size={16} className="text-green-600 flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-700">ลิงก์ Canva ของกลุ่ม</p>
                  <p className="text-xs text-gray-500 truncate">{groupCanvaInfo.link}</p>
                  {groupCanvaInfo.setByName && <p className="text-xs text-gray-400">ตั้งโดย: {groupCanvaInfo.setByName}</p>}
                </div>
              </div>
              <button onClick={handleOpenCanva}
                className="w-full py-3 bg-gradient-to-r from-[#7C5CBF] to-[#00C4CC] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow hover:shadow-lg transition-all hover:scale-[1.01]">
                <ExternalLink size={17}/> เปิด Canva ของกลุ่ม
              </button>
              <p className="text-center text-xs text-gray-400">
                ✅ ทุกคนในกลุ่มจะเปิด Canva เดียวกัน
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      {isStarted && (
        <>
          <div className="flex border-b border-gray-200 gap-4">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="card min-h-[250px]">

            {/* Missions */}
            {activeTab === 'missions' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl text-xs text-blue-800 font-medium mb-3">
                  <span className="text-base">👨‍🏫</span>
                  <div>
                    <p className="font-bold text-blue-900">ครูผู้สอนเป็นผู้ตรวจเช็คขั้นตอน (Missions)</p>
                    <p className="text-blue-700/80 text-[11px] mt-0.5">เมื่อนักเรียนปฏิบัติกิจกรรมในแต่ละขั้นตอน ครูจะเข้ามาตรวจและเช็คให้ในระบบ</p>
                  </div>
                </div>

                {missions.length === 0
                  ? <p className="text-gray-400 text-sm text-center py-6">ไม่มีขั้นตอนที่กำหนด</p>
                  : missions.map((m, i) => {
                      const st = getMissionStatus(m);
                      return (
                        <div key={m.id} className={`p-3.5 rounded-xl border-2 transition-all ${st === 'completed' ? 'border-green-200 bg-green-50/70' : st === 'in_progress' ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100 bg-gray-50'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${st === 'completed' ? 'bg-green-500 text-white' : st === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                              {st === 'completed' ? '✓' : i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm ${st === 'locked' ? 'text-gray-400' : 'text-gray-800'}`}>{m.title}</p>
                              {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                            </div>
                            <div className="flex-shrink-0">
                              {st === 'completed' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-lg">
                                  ✓ ครูตรวจผ่านแล้ว
                                </span>
                              ) : st === 'in_progress' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                  ⏳ รอครูตรวจ
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                                  🔒 รอดำเนินการ
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            )}

            {/* Checklist */}
            {activeTab === 'checklist' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl text-xs text-blue-800 font-medium mb-3">
                  <span className="text-base">📋</span>
                  <div>
                    <p className="font-bold text-blue-900">เกณฑ์การตรวจงาน (Checklist)</p>
                    <p className="text-blue-700/80 text-[11px] mt-0.5">รายการเหล่านี้ครูผู้สอนจะเป็นผู้ตรวจสอบและเช็คความถูกต้องให้ตามชิ้นงานที่ส่ง</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <CheckSquare size={16} className="text-primary"/> ผลการตรวจของครู
                  </h3>
                  <span className="text-sm font-bold text-primary">{checkedCount}/{checklistItems.length} ข้อ</span>
                </div>

                {checklistItems.length === 0
                  ? <p className="text-gray-400 text-sm text-center py-4">ไม่มี Checklist</p>
                  : checklistItems.map(item => {
                      const checked = getCheckStatus(item);
                      return (
                        <div key={item.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${checked ? 'bg-green-50/80 border-green-200' : 'bg-white border-gray-150'}`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input type="checkbox" checked={!!checked} disabled readOnly className="w-5 h-5 accent-green-600 rounded cursor-not-allowed"/>
                            <span className={`text-sm ${checked ? 'line-through text-gray-500 font-medium' : 'text-gray-700'}`}>{item.item_text}</span>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${checked ? 'text-green-700 bg-green-100 border border-green-200' : 'text-gray-400 bg-gray-100'}`}>
                            {checked ? '✓ ครูตรวจแล้ว' : 'รอครูตรวจ'}
                          </span>
                        </div>
                      );
                    })
                }
              </div>
            )}

            {/* Submit */}
            {activeTab === 'submit' && (
              <div className="space-y-4 max-w-md mx-auto">
                {isSubmitted ? (
                  <div className="text-center py-6 space-y-4">
                    {sc?.status === 'graded' ? (
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-100/70 border-2 border-emerald-300 rounded-2xl text-left space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-full">
                            <CheckCircle size={14}/> ครูตรวจประเมินเรียบร้อยแล้ว ✅
                          </span>
                          <span className="text-xs text-gray-500">
                            {sc?.graded_at ? new Date(sc.graded_at).toLocaleDateString('th-TH') : ''}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between border-b border-emerald-200/60 pb-3">
                          <span className="text-sm font-semibold text-gray-700">คะแนนที่ได้รับ:</span>
                          <span className="text-3xl font-extrabold text-emerald-700">
                            {sc?.score ?? 0} <span className="text-sm font-normal text-gray-500">/ {challenge?.max_score || 100} คะแนน</span>
                          </span>
                        </div>
                        {sc?.feedback_comment && (
                          <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/60 text-xs text-gray-700 space-y-1">
                            <p className="font-bold text-emerald-900">💬 ข้อเสนอแนะจากครูผู้สอน:</p>
                            <p className="text-gray-700 leading-relaxed">{sc.feedback_comment}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-5xl mb-2">🎉</p>
                        <h3 className="text-xl font-bold text-success mb-1">ส่งงานแล้ว!</h3>
                        <p className="text-xs text-gray-500 mb-2">งานของคุณส่งถึงครูเรียบร้อย กำลังรอครูตรวจประเมิน</p>
                      </div>
                    )}
                    {groupCanvaInfo?.link && (
                      <a href={groupCanvaInfo.link} target="_blank" rel="noopener noreferrer"
                        className="text-primary text-sm font-semibold underline block">
                        ดูผลงาน Canva ของกลุ่ม →
                      </a>
                    )}
                    <button onClick={() => navigate(`/student/challenges/${id}/summary`)}
                      className="btn-primary text-sm px-6 py-2.5">
                      ดูสรุปผลกลุ่ม →
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Preview link ที่จะส่ง */}
                    {groupCanvaInfo?.link ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-xs font-semibold text-green-700 mb-1">🔗 ลิงก์ที่จะส่ง (ลิงก์ Canva ของกลุ่ม)</p>
                        <p className="text-xs text-gray-600 truncate">{groupCanvaInfo.link}</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
                        ⚠️ ยังไม่มีลิงก์ Canva ของกลุ่ม — กรุณาตั้งลิงก์ก่อน
                      </div>
                    )}
                    <textarea className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm resize-none"
                      rows={2} placeholder="หมายเหตุถึงครู (ไม่จำเป็น)"
                      value={note} onChange={e => setNote(e.target.value)}/>
                    <button onClick={handleSubmitLink}
                      disabled={submitting || !groupCanvaInfo?.link}
                      className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                      <Send size={16}/> {submitting ? 'กำลังส่ง...' : 'ส่งงาน'}
                    </button>
                    {!groupCanvaInfo?.link && (
                      <button onClick={() => setActiveTab('missions')}
                        className="w-full py-2 text-sm text-primary underline">← ไปตั้งลิงก์ Canva ก่อน</button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
