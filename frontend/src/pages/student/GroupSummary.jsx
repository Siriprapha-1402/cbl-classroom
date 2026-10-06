import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Crown, CheckCircle, Clock, Users } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { resolveStudentGroup } from '../../lib/groupHelper';

export default function GroupSummary() {
  const { id } = useParams(); // challenge id
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [groups, setGroups] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [myGroupId, setMyGroupId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = React.useCallback(() => {
    Promise.all([
      api.get(`/groups/summary/${id}`),
      api.get(`/challenges/${id}`),
      api.get('/groups'),
    ]).then(([sRes, cRes, gRes]) => {
      setGroups(sRes.data.groups || []);
      setChallenge(cRes.data.challenge);
      const myGrp = resolveStudentGroup(gRes.data, user);
      setMyGroupId(myGrp?.id || null);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id, user]);

  useEffect(() => {
    loadData();

    let bc;
    try {
      bc = new BroadcastChannel('cbl_channel');
      bc.onmessage = () => loadData();
    } catch (e) {}

    const handleSync = (e) => {
      if (!e?.key || e.key === 'cbl_mock_db_clean_v6') loadData();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('cbl_storage_update', handleSync);
    const interval = setInterval(loadData, 4000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('cbl_storage_update', handleSync);
      clearInterval(interval);
    };
  }, [loadData]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"/></div>;

  const statusMap = {
    graded:      { label: 'ตรวจแล้ว', cls: 'bg-green-100 text-green-700' },
    submitted:   { label: 'รอตรวจ',   cls: 'bg-blue-100 text-blue-700' },
    in_progress: { label: 'กำลังทำ',  cls: 'bg-yellow-100 text-yellow-700' },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(`/student/challenges/${id}`)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
          <ArrowLeft size={18}/>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">สรุปผลการทำงาน</h1>
          <p className="text-sm text-gray-400">{challenge?.title}</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">👥</p>
          <p>ยังไม่มีกลุ่มในระบบ</p>
        </div>
      ) : groups.map(g => {
        const isMyGroup = g.id === myGroupId;
        const submitted = (g.members || []).filter(m => m.submitted_at || m.canva_link).length;
        const joined = (g.members || []).filter(m => m.did_join).length;

        return (
          <div key={g.id} className={`card ${isMyGroup ? 'ring-2 ring-primary' : ''}`}>
            {/* Group Header */}
            <div className="flex justify-between items-start mb-4 pb-3 border-b">
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Users size={18} className="text-primary"/>
                  {g.name}
                  {isMyGroup && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">กลุ่มของฉัน</span>}
                </h2>
                <div className="flex gap-3 text-xs text-gray-400 mt-1">
                  <span>👥 {(g.members||[]).length} คน</span>
                  <span>🟢 เข้าทำ {joined} คน</span>
                  <span>📤 ส่งแล้ว {submitted} คน</span>
                </div>
              </div>
              {g.avgScore !== null && (
                <div className="text-center">
                  <p className={`text-2xl font-bold ${g.avgScore >= 80 ? 'text-green-600' : g.avgScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {Math.round(g.avgScore)}
                  </p>
                  <p className="text-xs text-gray-400">คะแนนเฉลี่ย</p>
                </div>
              )}
            </div>

            {/* Canva Link */}
            {g.canvaLink && (
              <a href={g.canvaLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#7C5CBF]/10 to-[#00C4CC]/10 border border-[#7C5CBF]/30 rounded-xl mb-4 text-sm hover:bg-[#7C5CBF]/20 transition-colors">
                <ExternalLink size={16} className="text-[#7C5CBF]"/>
                <span className="text-[#7C5CBF] font-semibold">ดูผลงาน Canva ของกลุ่มนี้</span>
                <span className="text-gray-400 truncate text-xs ml-auto">{g.canvaLink}</span>
              </a>
            )}

            {/* Members */}
            <div className="space-y-2">
              {(g.members || []).map(m => {
                const st = statusMap[m.status];
                return (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      m.did_join ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {m.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-gray-800 text-sm">{m.name}</p>
                        {g.leader_id === m.id && <Crown size={12} className="text-accent flex-shrink-0"/>}
                        {m.did_join && <span className="text-xs text-green-500">🟢 เข้าทำแล้ว</span>}
                      </div>
                      <p className="text-xs text-gray-400">{m.username}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {st ? (
                        <span className={`badge text-xs ${st.cls}`}>{st.label}</span>
                      ) : (
                        <span className="badge text-xs bg-gray-100 text-gray-400">ยังไม่เริ่ม</span>
                      )}
                      {m.score !== null && m.score !== undefined && (
                        <span className={`text-sm font-bold ${m.score >= 80 ? 'text-green-600' : m.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {m.score} คะแนน
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <button onClick={() => navigate('/student/home')} className="w-full py-3 border-2 border-gray-200 rounded-xl text-gray-500 text-sm font-semibold hover:bg-gray-50">
        ← กลับหน้าหลัก
      </button>
    </div>
  );
}
