import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Star, RefreshCw, ExternalLink, Users, Activity, 
  CheckCircle2, Clock, AlertCircle, PlayCircle, Eye, ShieldAlert, Sparkles
} from 'lucide-react';
import api from '../../lib/api';

export default function Submissions() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [activity, setActivity] = useState({ 
    activeCount: 0, 
    inProgressCount: 0, 
    notStartedCount: 0, 
    submittedCount: 0, 
    totalCount: 0, 
    students: [], 
    byGroup: [] 
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'not_started' | 'in_progress' | 'submitted'
  const [loading, setLoading] = useState(false);
  const [loadingCh, setLoadingCh] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'group'
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    api.get('/challenges').then(r => {
      const all = r.data.challenges || [];
      setChallenges(all);
      if (all.length > 0) loadData(all[0].id);
    }).catch(console.error).finally(() => setLoadingCh(false));
  }, []);

  const refreshLive = useCallback(async (cid) => {
    if (!cid) return;
    try {
      const [sRes, aRes] = await Promise.all([
        api.get(`/challenges/${cid}/submissions`).catch(() => null),
        api.get(`/groups/activity/${cid}`).catch(() => null)
      ]);
      if (sRes?.data?.submissions) {
        setSubmissions(sRes.data.submissions);
      }
      if (aRes?.data) {
        setActivity(aRes.data);
        setLastUpdated(new Date());
      }
    } catch (e) {}
  }, []);

  const loadData = async (cid) => {
    setSelectedChallenge(cid);
    setLoading(true);
    await refreshLive(cid);
    setLoading(false);
  };

  // Auto refresh real-time activity and submissions every 4 seconds + BroadcastChannel listener
  useEffect(() => {
    if (!selectedChallenge) return;

    let bc;
    try {
      bc = new BroadcastChannel('cbl_channel');
      bc.onmessage = () => refreshLive(selectedChallenge);
    } catch (e) {}

    const handleSync = (e) => {
      if (!e?.key || e.key === 'cbl_mock_db_clean_v6') {
        refreshLive(selectedChallenge);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('cbl_storage_update', handleSync);

    const t = setInterval(() => {
      refreshLive(selectedChallenge);
    }, 4000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('cbl_storage_update', handleSync);
      clearInterval(t);
    };
  }, [selectedChallenge, refreshLive]);

  const handleOpenGrading = async (s) => {
    if (s.id) {
      navigate(`/teacher/grading/${s.id}`);
    } else if (s.student_user_id && selectedChallenge) {
      try {
        const res = await api.post(`/grade/init/${selectedChallenge}/${s.student_user_id}`);
        navigate(`/teacher/grading/${res.data.studentChallengeId}`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Map submissions with live activity status
  const mergedList = useMemo(() => {
    const actMap = {};
    (activity.students || []).forEach(st => {
      actMap[st.id] = st;
    });

    return submissions.map(s => {
      const act = actMap[s.student_user_id || s.id];
      const isSub = s.submitted_at || s.canva_link || act?.workingStatus === 'submitted';
      const isActive = act?.isActiveNow;
      const isInProg = (s.status === 'in_progress' || act?.workingStatus === 'in_progress') && !isSub && !isActive;
      
      let liveStatus = 'not_started';
      let liveLabel = 'ยังไม่ทำ';
      if (isSub) {
        liveStatus = 'submitted';
        liveLabel = 'ส่งงานแล้ว';
      } else if (isActive) {
        liveStatus = 'active';
        liveLabel = 'กำลังทำอยู่';
      } else if (isInProg) {
        liveStatus = 'in_progress';
        liveLabel = 'ทำค้างไว้';
      }

      return {
        ...s,
        liveStatus,
        liveLabel,
        isActiveNow: isActive,
        lastSeen: act?.lastSeen || null,
        group_name: s.group_name || act?.groupName || 'ยังไม่มีกลุ่ม'
      };
    });
  }, [submissions, activity]);

  const filtered = useMemo(() => {
    return mergedList.filter(s => {
      if (statusFilter !== 'all' && s.liveStatus !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (s.student_name || '').toLowerCase().includes(q) || (s.student_code || s.username || '').includes(q);
    });
  }, [mergedList, statusFilter, search]);

  const submittedCount = activity.submittedCount || mergedList.filter(s => s.liveStatus === 'submitted').length;
  const activeNowCount = activity.activeCount || mergedList.filter(s => s.liveStatus === 'active').length;
  const inProgCount = activity.inProgressCount || mergedList.filter(s => s.liveStatus === 'in_progress').length;
  const notStartedCount = activity.notStartedCount || mergedList.filter(s => s.liveStatus === 'not_started').length;
  const gradedCount = submissions.filter(s => s.score !== null && s.score !== undefined).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-gray-800 tracking-tight">ผลงานนักเรียนและการติดตามสด</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
              ตรวจเช็คแบบเรียลไทม์
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ดูสถานะสดว่านักเรียนคนใดกำลังเปิดทำงานอยู่, ใครยังไม่ทำ, หรือใครส่งงานแล้ว พร้อมให้คะแนนรายบุคคล
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">อัปเดตเมื่อ: {lastUpdated.toLocaleTimeString('th-TH')}</span>
          <button 
            onClick={() => selectedChallenge && loadData(selectedChallenge)}
            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-xl transition border border-gray-200"
            title="รีเฟรชข้อมูลตอนนี้"
          >
            <RefreshCw size={15}/>
          </button>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Activity size={40} className="mx-auto mb-2 opacity-30"/>
          <p className="font-bold text-gray-700">ยังไม่มีกิจกรรม</p>
          <p className="text-xs text-gray-400 mt-1">สร้างกิจกรรมแรกเพื่อเริ่มติดตามการทำงานของนักเรียน</p>
        </div>
      ) : (
        <>
          {/* Challenge Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">เลือกกิจกรรม:</span>
            {challenges.map(c => (
              <button 
                key={c.id} 
                onClick={() => loadData(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                  selectedChallenge == c.id 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/50'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>

          {/* ========================================================= */}
          {/* Real-time Working Activity Dashboard */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. กำลังทำงานอยู่ */}
            <div 
              onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                statusFilter === 'active' 
                  ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-400' 
                  : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"/>
                  กำลังทำงานอยู่ตอนนี้
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-white/80 px-2 py-0.5 rounded-full">
                  Live 🟢
                </span>
              </div>
              <p className="text-3xl font-black text-emerald-700">{activeNowCount} <span className="text-xs font-normal text-emerald-600">คน</span></p>
              <p className="text-[11px] text-emerald-600 mt-1">เปิดหน้ากิจกรรมหรือกำลังใช้งาน Canva</p>
            </div>

            {/* 2. ยังไม่เริ่มทำ / ไม่ได้ทำ */}
            <div 
              onClick={() => setStatusFilter(statusFilter === 'not_started' ? 'all' : 'not_started')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                statusFilter === 'not_started' 
                  ? 'bg-rose-100/70 border-rose-400 ring-2 ring-rose-400' 
                  : 'bg-rose-50/60 border-rose-200 hover:bg-rose-100/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"/>
                  ยังไม่เริ่มทำ / ไม่ได้ทำ
                </span>
                <span className="text-[11px] font-bold text-rose-600 bg-white/80 px-2 py-0.5 rounded-full">
                  Inactive ⚪
                </span>
              </div>
              <p className="text-3xl font-black text-rose-700">{notStartedCount} <span className="text-xs font-normal text-rose-600">คน</span></p>
              <p className="text-[11px] text-rose-600 mt-1">ยังไม่กดเริ่มและไม่ได้เปิดกิจกรรม</p>
            </div>

            {/* 3. ทำค้างไว้ */}
            <div 
              onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                statusFilter === 'in_progress' 
                  ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-400' 
                  : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"/>
                  ทำค้างไว้ (ไม่ได้เปิดอยู่)
                </span>
                <span className="text-[11px] font-bold text-amber-600 bg-white/80 px-2 py-0.5 rounded-full">
                  Away 🟡
                </span>
              </div>
              <p className="text-3xl font-black text-amber-700">{inProgCount} <span className="text-xs font-normal text-amber-600">คน</span></p>
              <p className="text-[11px] text-amber-600 mt-1">เริ่มทำแล้วแต่ไม่ได้ออนไลน์ขณะนี้</p>
            </div>

            {/* 4. ส่งงานแล้ว */}
            <div 
              onClick={() => setStatusFilter(statusFilter === 'submitted' ? 'all' : 'submitted')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                statusFilter === 'submitted' 
                  ? 'bg-blue-100/70 border-blue-400 ring-2 ring-blue-400' 
                  : 'bg-blue-50/60 border-blue-200 hover:bg-blue-100/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <CheckCircle2 size={14}/>
                  ส่งงานแล้ว
                </span>
                <span className="text-[11px] font-bold text-blue-600 bg-white/80 px-2 py-0.5 rounded-full">
                  {gradedCount} ตรวจแล้ว
                </span>
              </div>
              <p className="text-3xl font-black text-blue-700">{submittedCount} <span className="text-xs font-normal text-blue-600">คน</span></p>
              <p className="text-[11px] text-blue-600 mt-1">ส่ง Canva Link เรียบร้อยแล้ว</p>
            </div>
          </div>

          {/* Filter Bar & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button 
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  statusFilter === 'all' ? 'bg-gray-800 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ทั้งหมด ({mergedList.length})
              </button>
              <button 
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"/>
                🟢 กำลังทำ ({activeNowCount})
              </button>
              <button 
                onClick={() => setStatusFilter('not_started')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  statusFilter === 'not_started' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400"/>
                ⚪ ยังไม่ทำ ({notStartedCount})
              </button>
              <button 
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  statusFilter === 'in_progress' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"/>
                🟡 ทำค้างไว้ ({inProgCount})
              </button>
              <button 
                onClick={() => setStatusFilter('submitted')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  statusFilter === 'submitted' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400"/>
                ✅ ส่งแล้ว ({submittedCount})
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 p-1 rounded-xl text-xs">
                <button 
                  onClick={() => setView('list')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    view === 'list' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  รายคน
                </button>
                <button 
                  onClick={() => setView('group')}
                  className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                    view === 'group' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  <Users size={12}/> รายกลุ่ม
                </button>
              </div>
            </div>
          </div>

          {/* Search Box */}
          {view === 'list' && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
              <input 
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-primary bg-white shadow-xs"
                placeholder="ค้นหาชื่อนักเรียน หรือ รหัสประจำตัว..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. List View (รายบุคคลพร้อมสถานะเรียลไทม์) */}
          {/* ========================================================= */}
          {view === 'list' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold">
                    <tr>
                      <th className="text-left p-3.5">นักเรียน</th>
                      <th className="text-center p-3.5">กลุ่ม</th>
                      <th className="text-center p-3.5">สถานะการทำงาน (Live ⚡)</th>
                      <th className="text-center p-3.5">ขั้นตอน (Missions)</th>
                      <th className="text-center p-3.5">Checklist</th>
                      <th className="text-center p-3.5">ผลงาน Canva</th>
                      <th className="text-center p-3.5">คะแนน</th>
                      <th className="text-center p-3.5">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"/>
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-gray-400">
                          ไม่พบรายชื่อตามเงื่อนไขที่เลือก
                        </td>
                      </tr>
                    ) : filtered.map(s => {
                      const missionsDone = s.completed_missions || 0;
                      const missionsTotal = s.total_missions || 0;
                      const checkDone = s.completed_checklists || 0;
                      const checkTotal = s.total_checklists || 0;

                      return (
                        <tr key={s.student_user_id || s.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Student */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${
                                s.isActiveNow ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {s.student_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{s.student_name}</p>
                                <p className="text-[11px] text-gray-400 font-mono">{s.student_code || s.username}</p>
                              </div>
                            </div>
                          </td>

                          {/* Group */}
                          <td className="p-3.5 text-center">
                            <span className="font-medium text-gray-600 bg-gray-50 border px-2 py-0.5 rounded-lg text-[11px]">
                              {s.group_name}
                            </span>
                          </td>

                          {/* Live Working Status */}
                          <td className="p-3.5 text-center">
                            {s.liveStatus === 'active' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"/>
                                กำลังทำอยู่ 🟢
                              </span>
                            )}
                            {s.liveStatus === 'not_started' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"/>
                                ยังไม่ทำ ⚪
                              </span>
                            )}
                            {s.liveStatus === 'in_progress' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"/>
                                ทำค้างไว้ 🟡
                              </span>
                            )}
                            {s.liveStatus === 'submitted' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                                <CheckCircle2 size={12}/>
                                ส่งงานแล้ว ✅
                              </span>
                            )}
                          </td>

                          {/* Missions Progress */}
                          <td className="p-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                              missionsTotal > 0 && missionsDone >= missionsTotal
                                ? 'bg-blue-100 text-blue-700'
                                : missionsDone > 0
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {missionsDone}/{missionsTotal} ผ่าน
                            </span>
                          </td>

                          {/* Checklist Progress */}
                          <td className="p-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                              checkTotal > 0 && checkDone >= checkTotal
                                ? 'bg-green-100 text-green-700'
                                : checkDone > 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {checkDone}/{checkTotal} ตรวจแล้ว
                            </span>
                          </td>

                          {/* Work / Canva */}
                          <td className="p-3.5 text-center">
                            {s.canva_link ? (
                              <a 
                                href={s.canva_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-[#7C5CBF] bg-[#7C5CBF]/10 px-2.5 py-1 rounded-lg hover:bg-[#7C5CBF]/20 font-bold shadow-2xs"
                              >
                                <ExternalLink size={12}/> Canva
                              </a>
                            ) : s.file_name ? (
                              <span className="text-[11px] text-blue-600 font-medium">📁 ไฟล์</span>
                            ) : (
                              <span className="text-[11px] text-gray-300">—</span>
                            )}
                          </td>

                          {/* Score */}
                          <td className="p-3.5 text-center">
                            {s.score !== null && s.score !== undefined ? (
                              <span className="font-bold text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                {s.score} คะแนน
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400">ยังไม่ตรวจ</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="p-3.5 text-center">
                            <button 
                              onClick={() => handleOpenGrading(s)}
                              className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark transition shadow-xs"
                            >
                              {s.score !== null ? 'ดู/แก้' : 'ตรวจ'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. Group View (รายกลุ่ม) */}
          {/* ========================================================= */}
          {view === 'group' && selectedChallenge && (
            <GroupView challengeId={selectedChallenge} activity={activity} navigate={navigate}/>
          )}
        </>
      )}
    </div>
  );
}

// GroupView sub-component
function GroupView({ challengeId, activity, navigate }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/groups/summary/${challengeId}`)
      .then(r => setGroups(r.data.groups || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [challengeId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"/>
      </div>
    );
  }

  // Create active student lookup map
  const actMap = {};
  (activity.students || []).forEach(st => {
    actMap[st.id] = st;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.map(g => {
        const memberList = g.members || [];
        const submittedCount = memberList.filter(m => m.submitted_at || m.canva_link || m.status === 'submitted').length;
        const activeCount = memberList.filter(m => actMap[m.id]?.isActiveNow).length;

        return (
          <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3 pb-2.5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Users size={15} className="text-primary"/> {g.name}
                </h3>
                <div className="flex gap-2 text-xs mt-1">
                  <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${
                    activeCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}/>
                    กำลังทำ {activeCount}/{memberList.length} คน
                  </span>
                  <span className="text-gray-400 self-center">·</span>
                  <span className="text-gray-500 font-medium">ส่งแล้ว {submittedCount}/{memberList.length} คน</span>
                </div>
              </div>

              {g.avgScore !== null && (
                <span className={`text-base font-black ${g.avgScore >= 80 ? 'text-green-600' : g.avgScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                  {Math.round(g.avgScore)} คะแนน
                </span>
              )}
            </div>

            {/* Group Canva Link */}
            {g.canvaLink && (
              <div className="mb-3 p-2 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between text-xs">
                <span className="text-purple-800 font-semibold truncate flex items-center gap-1">
                  🎨 Canva กลุ่ม
                </span>
                <a 
                  href={g.canvaLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-bold text-[#7C5CBF] hover:underline flex items-center gap-1"
                >
                  เปิดดู <ExternalLink size={11}/>
                </a>
              </div>
            )}

            {/* Member List */}
            <ul className="space-y-1.5">
              {memberList.map(m => {
                const act = actMap[m.id];
                const isOnline = act?.isActiveNow;
                const isSub = m.submitted_at || m.canva_link || m.status === 'submitted' || m.status === 'graded';
                const isInProg = !isSub && !isOnline && m.status === 'in_progress';

                const openMember = async () => {
                  if (m.sc_id) {
                    navigate(`/teacher/grading/${m.sc_id}`);
                  } else {
                    try {
                      const res = await api.post(`/grade/init/${challengeId}/${m.id}`);
                      navigate(`/teacher/grading/${res.data.studentChallengeId}`);
                    } catch (err) {
                      console.error(err);
                    }
                  }
                };

                return (
                  <li key={m.id} className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50 text-xs">
                    <div className="flex items-center gap-2 truncate flex-1 pr-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isSub ? 'bg-blue-500' : isOnline ? 'bg-emerald-500 animate-ping' : isInProg ? 'bg-amber-400' : 'bg-gray-300'
                      }`}/>
                      <span className="font-medium text-gray-800 truncate">{m.name}</span>
                      {isOnline && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full font-bold">
                          Live 🟢
                        </span>
                      )}
                      {!isOnline && !isSub && !isInProg && (
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded-full">
                          ยังไม่ทำ ⚪
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {m.score !== null && m.score !== undefined ? (
                        <button onClick={openMember} className="font-bold text-primary hover:underline">
                          {m.score} คะแนน
                        </button>
                      ) : (
                        <button 
                          onClick={openMember} 
                          className="text-[11px] text-white bg-primary px-2.5 py-0.5 rounded-md hover:bg-primary-dark font-semibold shadow-2xs"
                        >
                          ตรวจงาน
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
