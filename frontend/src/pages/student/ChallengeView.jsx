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

  // Group Canva Link state (เฉพาะของแต่ละกลุ่มเท่านั้น ให้นักเรียนเพิ่มเอง)
  const [groupCanvaInfo, setGroupCanvaInfo] = useState(null); // { link, groupName, setByName, hasGroup }
  const [showSetLink, setShowSetLink] = useState(false);
  const [newCanvaLink, setNewCanvaLink] = useState('');
  const [submitCanvaLink, setSubmitCanvaLink] = useState('');
  const [settingLink, setSettingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
      window.open('https://www.canva.com', '_blank');
      setShowSetLink(true);
    }
  };

  // ตั้งลิงก์ Canva ของกลุ่มตัวเอง (ให้นักเรียนเพิ่มเอง)
  const handleSetGroupLink = async (overrideLink) => {
    const linkToSave = (typeof overrideLink === 'string' ? overrideLink : newCanvaLink).trim();
    if (!linkToSave) return null;
    setSettingLink(true);
    const res = await api.post(`/groups/canva-link/${id}`, { canvaLink: linkToSave }).catch(e => {
      alert(e.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกลิงก์ Canva ของกลุ่ม'); 
      return null;
    });
    if (res) {
      await loadGroupCanva();
      setShowSetLink(false);
      setNewCanvaLink('');
      setSubmitCanvaLink('');
    }
    setSettingLink(false);
    return res;
  };

  // ส่งงาน — ต้องส่งลิงก์ Canva ของกลุ่มตัวเองเท่านั้น
  const handleSubmitLink = async () => {
    let submitLink = groupCanvaInfo?.link;
    if (!submitLink && submitCanvaLink.trim()) {
      const saved = await handleSetGroupLink(submitCanvaLink.trim());
      if (!saved) return;
      submitLink = submitCanvaLink.trim();
    }
    if (!submitLink) { 
      alert('กรุณาเพิ่มลิงก์ Canva ของกลุ่มก่อนส่งงาน'); 
      return; 
    }
    setSubmitting(true);
    await api.post(`/challenges/${id}/submit-link`, { canvaLink: submitLink, note }).catch(e => {
      alert(e.response?.data?.error || 'เกิดข้อผิดพลาดในการส่งงาน');
    });
    await load();
    await loadGroupCanva();
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

      {/* ─── CANVA SECTION (เฉพาะของแต่ละกลุ่มเท่านั้น ให้นักเรียนเพิ่มเอง) ─── */}
      {isStarted && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎨</span>
              <div>
                <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                  ลิงก์ Canva ของกลุ่ม {hasGroup && <span className="text-primary font-bold">({currentGroupName})</span>}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {hasGroup ? `ลิงก์นี้เฉพาะกลุ่ม "${currentGroupName}" เท่านั้น ให้นักเรียนเพิ่ม/แก้ไขเอง` : 'ต้องมีกลุ่มก่อนเพิ่มหรือส่งลิงก์ Canva'}
                </p>
              </div>
            </div>
            {hasGroup && groupCanvaInfo?.link && (
              <button 
                onClick={() => { setNewCanvaLink(groupCanvaInfo.link); setShowSetLink(!showSetLink); }}
                className="flex items-center gap-1 text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg font-semibold transition"
              >
                <Edit3 size={13}/> {showSetLink ? 'ปิดฟอร์ม' : 'แก้ไขลิงก์'}
              </button>
            )}
          </div>

          {/* กรณีผู้ใช้ยังไม่มีกลุ่ม */}
          {!hasGroup && (
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <span>⚠️</span> <span>คุณยังไม่ได้อยู่ในกลุ่ม</span>
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                ลิงก์ผลงาน Canva ต้องเป็นของแต่ละกลุ่มเท่านั้น เพื่อให้นักเรียนในกลุ่มทำงานร่วมกันและส่งงานเป็นกลุ่ม
              </p>
              <button 
                onClick={() => navigate('/student/groups')}
                className="btn-primary text-xs px-3.5 py-2 rounded-xl"
              >
                ไปหน้าเลือกหรือจัดกลุ่ม →
              </button>
            </div>
          )}

          {/* 1. กรณีมีลิงก์ของกลุ่มแล้ว */}
          {hasGroup && groupCanvaInfo?.link && !showSetLink && (
            <div className="p-4 bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-purple-50/40 rounded-2xl border-2 border-emerald-300 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle size={15} className="text-emerald-600"/> ลิงก์ Canva ของ {currentGroupName} พร้อมใช้งาน
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
                  เฉพาะกลุ่มนี้เท่านั้น ✅
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-emerald-200 shadow-xs">
                <Link2 size={16} className="text-[#7C5CBF] flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 truncate font-mono font-medium">
                    {groupCanvaInfo.link}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <span>👤 เพิ่มโดย: <b className="text-gray-600">{groupCanvaInfo.setByName || 'สมาชิกในกลุ่ม'}</b></span>
                    <span>·</span>
                    <span>กลุ่ม: <b className="text-primary">{currentGroupName}</b></span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(groupCanvaInfo.link);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium whitespace-nowrap"
                >
                  {copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={handleOpenCanva}
                  className="flex-1 py-3 bg-gradient-to-r from-[#7C5CBF] to-[#00C4CC] hover:opacity-95 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <ExternalLink size={16}/> 🚀 เปิด Canva ของกลุ่ม {currentGroupName}
                </button>
                <button
                  type="button"
                  onClick={() => { setNewCanvaLink(groupCanvaInfo.link); setShowSetLink(true); }}
                  className="px-4 py-2.5 border border-purple-200 hover:bg-purple-50 text-[#7C5CBF] rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <Edit3 size={12}/> เปลี่ยนลิงก์
                </button>
              </div>

              <p className="text-center text-[11px] text-gray-500 font-medium">
                👥 นักเรียนทุกคนใน <b>{currentGroupName}</b> จะเปิดและส่งงานด้วยลิงก์ Canva เดียวกันนี้
              </p>
            </div>
          )}

          {/* 2. กรณียังไม่มีลิงก์กลุ่ม — ให้แบบฟอร์มเพิ่มลิงก์ทันที สะดวก ชัดเจน */}
          {hasGroup && !groupCanvaInfo?.link && !showSetLink && (
            <div className="p-4 bg-purple-50/80 rounded-2xl border-2 border-dashed border-[#7C5CBF]/40 space-y-3">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <span>✨</span>
                <span>ให้นักเรียนเพิ่มลิงก์ Canva ของกลุ่ม {currentGroupName}</span>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                กลุ่ม <b>"{currentGroupName}"</b> ยังไม่ได้เพิ่มลิงก์ Canva — ให้นักเรียนในกลุ่มเปิด Canva เพื่อสร้างผลงาน แล้วนำ Share Link มาวางที่นี่
              </p>

              <div className="space-y-2 pt-1">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    className="flex-1 p-2.5 rounded-xl border border-purple-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#7C5CBF] bg-white font-mono"
                    placeholder="วาง Canva Share Link (https://www.canva.com/design/...)"
                    value={newCanvaLink}
                    onChange={e => setNewCanvaLink(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSetGroupLink()}
                  />
                  <button
                    onClick={() => handleSetGroupLink()}
                    disabled={settingLink || !newCanvaLink.trim()}
                    className="px-4 py-2.5 bg-[#7C5CBF] hover:bg-[#6849a6] text-white rounded-xl text-xs font-bold disabled:opacity-50 whitespace-nowrap shadow-xs"
                  >
                    {settingLink ? 'กำลังบันทึก...' : '💾 บันทึกลิงก์ของกลุ่ม'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-1 gap-2 text-xs">
                  <button 
                    onClick={handleOpenCanva}
                    className="text-xs text-[#7C5CBF] hover:underline font-semibold flex items-center gap-1"
                  >
                    <ExternalLink size={12}/> เปิด Canva เพื่อเริ่มสร้างงาน ↗
                  </button>
                  <span className="text-[11px] text-gray-500">
                    * เมื่อบันทึกแล้ว สมาชิกใน {currentGroupName} ทุกคนจะเห็นและใช้ร่วมกัน
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Form แก้ไข / เปลี่ยนลิงก์ */}
          {hasGroup && showSetLink && (
            <div className="p-4 bg-purple-50 rounded-2xl border-2 border-[#7C5CBF]/40 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Edit3 size={13}/> แก้ไข/เปลี่ยนลิงก์ Canva ของกลุ่ม {currentGroupName}
                </p>
                <button 
                  onClick={() => { setShowSetLink(false); setNewCanvaLink(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕ ยกเลิก
                </button>
              </div>
              <p className="text-xs text-purple-700">
                วาง Share Link ใหม่จาก Canva ลิงก์นี้จะอัปเดตสำหรับเพื่อนทุกคนในกลุ่ม <b>{currentGroupName}</b>
              </p>
              <input
                className="w-full p-2.5 rounded-xl border border-purple-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#7C5CBF] bg-white font-mono"
                placeholder="https://www.canva.com/design/..."
                value={newCanvaLink}
                autoFocus
                onChange={e => setNewCanvaLink(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetGroupLink()}
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSetGroupLink()}
                  disabled={settingLink || !newCanvaLink.trim()}
                  className="flex-1 py-2.5 bg-[#7C5CBF] hover:bg-[#6849a6] text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {settingLink ? 'กำลังบันทึก...' : '💾 บันทึกลิงก์ใหม่สำหรับกลุ่ม'}
                </button>
                <button 
                  onClick={() => { setShowSetLink(false); setNewCanvaLink(''); }}
                  className="px-4 py-2.5 border rounded-xl text-gray-500 text-xs hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
              </div>
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
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <span>📤</span> <span>ส่งผลงานสำหรับ: <b>{currentGroupName}</b></span>
                      </p>
                      <p className="text-blue-700/80 text-[11px]">
                        ลิงก์ Canva ที่ส่งต้องเป็นของกลุ่ม <b>{currentGroupName}</b> เท่านั้น (เฉพาะกลุ่มนี้)
                      </p>
                    </div>

                    {/* Preview link ที่จะส่ง หรือ ช่องให้ใส่ลิงก์กลุ่มโดยตรง */}
                    {groupCanvaInfo?.link ? (
                      <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle size={14} className="text-emerald-600"/> ลิงก์ Canva ของกลุ่มที่จะส่ง:
                          </span>
                          <button
                            type="button"
                            onClick={() => { setNewCanvaLink(groupCanvaInfo.link); setShowSetLink(true); }}
                            className="text-[11px] text-primary hover:underline font-semibold"
                          >
                            แก้ไขลิงก์ ✏️
                          </button>
                        </div>
                        <p className="text-xs text-gray-700 truncate font-mono bg-white p-2.5 rounded-xl border border-emerald-200">
                          {groupCanvaInfo.link}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                          <span>กลุ่ม: <b className="text-primary">{currentGroupName}</b></span>
                          <a 
                            href={groupCanvaInfo.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#7C5CBF] font-bold hover:underline flex items-center gap-0.5"
                          >
                            ลองเปิดดู <ExternalLink size={10}/>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-purple-50 border-2 border-purple-300 rounded-2xl space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                          <span>⚠️</span> <span>กลุ่ม {currentGroupName} ยังไม่ได้เพิ่มลิงก์ Canva</span>
                        </div>
                        <p className="text-[11px] text-purple-700 leading-relaxed">
                          กรุณาวางลิงก์ Canva ของกลุ่ม <b>{currentGroupName}</b> ด้านล่าง เพื่อบันทึกเป็นลิงก์กลุ่มและส่งงาน:
                        </p>
                        <input
                          className="w-full p-2.5 rounded-xl border border-purple-300 text-xs font-mono outline-none focus:ring-2 focus:ring-[#7C5CBF] bg-white"
                          placeholder="https://www.canva.com/design/... (ลิงก์ Canva ของกลุ่ม)"
                          value={submitCanvaLink}
                          onChange={e => setSubmitCanvaLink(e.target.value)}
                        />
                        <div className="flex justify-between items-center text-[11px]">
                          <button
                            type="button"
                            onClick={handleOpenCanva}
                            className="text-[#7C5CBF] hover:underline font-semibold flex items-center gap-1"
                          >
                            <ExternalLink size={11}/> เปิด Canva เพื่อสร้างงาน ↗
                          </button>
                          <span className="text-gray-400">* ระบบจะบันทึกลิงก์นี้ให้ทั้งกลุ่มทันที</span>
                        </div>
                      </div>
                    )}

                    <textarea 
                      className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm resize-none"
                      rows={2} 
                      placeholder="หมายเหตุถึงครู (ไม่จำเป็น)"
                      value={note} 
                      onChange={e => setNote(e.target.value)}
                    />

                    <button 
                      onClick={handleSubmitLink}
                      disabled={submitting || (!groupCanvaInfo?.link && !submitCanvaLink.trim())}
                      className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-bold shadow-md"
                    >
                      <Send size={16}/> {submitting ? 'กำลังส่งงาน...' : `ส่งงาน (ในนามกลุ่ม ${currentGroupName})`}
                    </button>
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
