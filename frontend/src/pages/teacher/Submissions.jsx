import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, RefreshCw, ExternalLink, Users, Activity } from 'lucide-react';
import api from '../../lib/api';

export default function Submissions() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [activity, setActivity] = useState({ activeCount: 0, byGroup: [] });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCh, setLoadingCh] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'group'

  useEffect(() => {
    api.get('/challenges').then(r => {
      const all = r.data.challenges || [];
      setChallenges(all);
      if (all.length > 0) loadData(all[0].id);
    }).catch(console.error).finally(() => setLoadingCh(false));
  }, []);

  // Auto refresh activity every 15 seconds
  useEffect(() => {
    if (!selectedChallenge) return;
    const t = setInterval(() => loadActivity(selectedChallenge), 15000);
    return () => clearInterval(t);
  }, [selectedChallenge]);

  const loadActivity = async (cid) => {
    const res = await api.get(`/groups/activity/${cid}`).catch(() => null);
    if (res) setActivity(res.data);
  };

  const loadData = async (cid) => {
    setSelectedChallenge(cid);
    setLoading(true);
    const [sRes] = await Promise.all([
      api.get(`/challenges/${cid}/submissions`).catch(() => ({ data: { submissions: [] } })),
    ]);
    setSubmissions(sRes.data.submissions || []);
    await loadActivity(cid);
    setLoading(false);
  };

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

  const filtered = submissions.filter(s =>
    !search || s.student_name?.toLowerCase().includes(search.toLowerCase()) || s.student_code?.includes(search)
  );

  const submittedCount = submissions.filter(s => s.submitted_at || s.canva_link).length;
  const gradedCount = submissions.filter(s => s.score !== null && s.score !== undefined).length;
  const notSubmitted = submissions.length - submittedCount;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">ผลงานนักเรียนและการตรวจเช็ค</h1>
        <button onClick={() => selectedChallenge && loadData(selectedChallenge)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
          <RefreshCw size={16}/>
        </button>
      </div>

      {challenges.length === 0 ? (
        <div className="card text-center py-12 text-gray-400"><p>ยังไม่มีกิจกรรม</p></div>
      ) : (
        <>
          {/* Challenge Selector */}
          <div className="flex flex-wrap gap-2">
            {challenges.map(c => (
              <button key={c.id} onClick={() => loadData(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedChallenge == c.id ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>
                {c.title}
              </button>
            ))}
          </div>

          {/* Real-time Activity Banner */}
          {activity.activeCount > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"/>
                <span className="font-bold text-green-700 text-sm">กำลังทำงานอยู่ตอนนี้ — {activity.activeCount} คน</span>
              </div>
              {activity.byGroup.map((g, i) => (
                <div key={i} className="mb-2">
                  <p className="text-xs text-green-600 font-semibold mb-1">{g.groupName}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.members.map(m => (
                      <span key={m.student_id} className="inline-flex items-center gap-1 bg-white border border-green-200 text-green-700 text-xs px-2 py-1 rounded-full">
                        🟢 {m.student_name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'ส่งงานแล้ว', value: submittedCount, color: 'text-green-600' },
              { label: 'ยังไม่ส่ง',   value: notSubmitted,   color: 'text-orange-500' },
              { label: 'ตรวจแล้ว',   value: gradedCount,    color: 'text-blue-600' },
            ].map((s, i) => (
              <div key={i} className="card !p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button onClick={() => setView('list')} className={`px-4 py-2 rounded-xl text-sm font-medium ${view === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
              รายคน ({filtered.length})
            </button>
            <button onClick={() => setView('group')} className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium ${view === 'group' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
              <Users size={14}/> รายกลุ่ม
            </button>
          </div>

          {/* Search (list view) */}
          {view === 'list' && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15}/>
              <input className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"
                placeholder="ค้นหาชื่อนักเรียน หรือรหัส..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
          )}

          {/* List View */}
          {view === 'list' && (
            <div className="card overflow-x-auto !p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3.5 text-gray-500 font-semibold text-xs">นักเรียน</th>
                    <th className="text-center p-3.5 text-gray-500 font-semibold text-xs">กลุ่ม</th>
                    <th className="text-center p-3.5 text-gray-500 font-semibold text-xs">ขั้นตอน (Missions)</th>
                    <th className="text-center p-3.5 text-gray-500 font-semibold text-xs">Checklist</th>
                    <th className="text-center p-3.5 text-gray-500 font-semibold text-xs">ผลงาน</th>
                    <th className="text-center p-3.5 text-gray-500 font-semibold text-xs">คะแนน</th>
                    <th className="text-center p-3.5 text-gray-500 font-semibold text-xs">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"/></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-300">ไม่พบข้อมูล</td></tr>
                  ) : filtered.map(s => {
                    const missionsDone = s.completed_missions || 0;
                    const missionsTotal = s.total_missions || 0;
                    const checkDone = s.completed_checklists || 0;
                    const checkTotal = s.total_checklists || 0;

                    return (
                      <tr key={s.student_user_id || s.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3.5">
                          <p className="font-semibold text-gray-800">{s.student_name}</p>
                          <p className="text-xs text-gray-400">{s.student_code || s.username}</p>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="text-xs text-gray-500">{s.group_name || '—'}</span>
                        </td>
                        {/* Missions Progress */}
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
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
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
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
                            <a href={s.canva_link} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#7C5CBF] bg-[#7C5CBF]/10 px-2 py-1 rounded-lg hover:bg-[#7C5CBF]/20 font-medium">
                              <ExternalLink size={12}/> Canva
                            </a>
                          ) : s.file_name ? (
                            <span className="text-xs text-blue-600 font-medium">📁 ไฟล์</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        {/* Score */}
                        <td className="p-3.5 text-center">
                          {s.score !== null && s.score !== undefined ? (
                            <span className="font-semibold text-sm text-green-700">{s.score} คะแนน</span>
                          ) : (
                            <span className="text-xs text-gray-400">ยังไม่ตรวจ</span>
                          )}
                        </td>
                        {/* Action */}
                        <td className="p-3.5 text-center">
                          <button onClick={() => handleOpenGrading(s)}
                            className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors">
                            {s.score !== null ? 'ดู/แก้' : 'ตรวจ'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Group View */}
          {view === 'group' && selectedChallenge && (
            <GroupView challengeId={selectedChallenge} navigate={navigate}/>
          )}
        </>
      )}
    </div>
  );
}

// GroupView sub-component
function GroupView({ challengeId, navigate }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/groups/summary/${challengeId}`)
      .then(r => setGroups(r.data.groups || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [challengeId]);

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"/></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.map(g => {
        const submitted = (g.members||[]).filter(m => m.submitted_at || m.canva_link).length;
        const joined = (g.members||[]).filter(m => m.did_join).length;
        return (
          <div key={g.id} className="card">
            <div className="flex justify-between items-start mb-3 pb-2 border-b">
              <div>
                <h3 className="font-bold text-gray-800">{g.name}</h3>
                <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                  <span>🟢 เข้าทำ {joined}/{(g.members||[]).length}</span>
                  <span>📤 ส่ง {submitted}/{(g.members||[]).length}</span>
                </div>
              </div>
              {g.avgScore !== null && (
                <span className={`text-lg font-bold ${g.avgScore >= 80 ? 'text-green-600' : g.avgScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {Math.round(g.avgScore)} คะแนน
                </span>
              )}
            </div>
            {g.canvaLink && (
              <a href={g.canvaLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#7C5CBF] mb-3 hover:underline">
                <ExternalLink size={12}/> ดูผลงาน Canva
              </a>
            )}
            <ul className="space-y-1.5">
              {(g.members||[]).map(m => {
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
                  <li key={m.id} className="flex items-center gap-2 text-sm py-0.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.did_join ? 'bg-green-400' : 'bg-gray-200'}`}/>
                    <span className="flex-1 text-gray-700 truncate">{m.name}</span>
                    {m.score !== null && m.score !== undefined ? (
                      <button onClick={openMember} className="text-xs font-bold text-primary hover:underline">
                        {m.score} คะแนน (ดู/แก้)
                      </button>
                    ) : (
                      <button onClick={openMember} className="text-xs text-white bg-primary px-2.5 py-0.5 rounded-lg hover:bg-primary/90 font-semibold shadow-xs">
                        ตรวจเช็คงาน
                      </button>
                    )}
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
