import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { resolveStudentGroup } from '../../lib/groupHelper';

export default function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = React.useCallback(() => {
    Promise.all([
      api.get('/challenges').catch(() => ({ data: { challenges: [] } })),
      api.get('/groups').catch(() => ({ data: { groups: [], myGroup: null } }))
    ])
      .then(([cRes, gRes]) => {
        setChallenges(cRes.data.challenges || []);
        const group = resolveStudentGroup(gRes.data, user);
        setMyGroup(group);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

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
    const interval = setInterval(loadData, 3000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('cbl_storage_update', handleSync);
      clearInterval(interval);
    };
  }, [loadData]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"/></div>;

  const statusConfig = {
    graded:      { label: 'ตรวจแล้ว',   cls: 'bg-green-100 text-green-700',  emoji: '✅' },
    submitted:   { label: 'รอตรวจ',     cls: 'bg-blue-100 text-blue-700',    emoji: '📤' },
    in_progress: { label: 'กำลังทำ',    cls: 'bg-yellow-100 text-yellow-700', emoji: '⏳' },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white shadow-md">
        <p className="text-white/70 text-sm mb-1">ยินดีต้อนรับ 👋</p>
        <h1 className="text-xl font-bold">{user?.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-white/80 text-sm">{user?.student_id || user?.username} · ปวช.1/1</span>
          {myGroup ? (
            <span className="inline-flex items-center gap-1 bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-xs">
              👥 {myGroup.name} (อยู่ในกลุ่มแล้ว ✅)
            </span>
          ) : (
            <button 
              onClick={() => navigate('/student/groups')}
              className="inline-flex items-center gap-1 bg-amber-400/90 text-amber-950 px-2.5 py-0.5 rounded-full text-xs font-bold hover:bg-amber-300 transition"
            >
              ⚠️ ยังไม่มีกลุ่ม — คลิกเข้ากลุ่ม
            </button>
          )}
        </div>
      </div>

      {/* Pre-test & Post-test Quick Card */}
      <div 
        onClick={() => navigate('/student/quizzes')}
        className="card !p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white border-amber-200/80 hover:border-amber-400 cursor-pointer hover:shadow-md transition-all flex items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition">
            📝
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge text-[11px] bg-amber-100 text-amber-800 font-bold">10 ข้อ · 4 ตัวเลือก</span>
              <span className="text-xs text-gray-400 font-medium">Microsoft PowerPoint</span>
            </div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base mt-0.5">แบบทดสอบก่อนเรียน & หลังเรียน</h3>
            <p className="text-xs text-gray-500 mt-0.5">ทดสอบความรู้พื้นฐานและวัดผลสัมฤทธิ์ทางการเรียนรู้</p>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 group-hover:translate-x-1 transition shadow-sm">
          <ChevronRight size={18}/>
        </div>
      </div>

      {/* Challenges */}
      <div>
        <h2 className="font-bold text-gray-700 mb-3">กิจกรรมทั้งหมด</h2>
        {challenges.length === 0 ? (
          <div className="card text-center py-14 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">ยังไม่มีกิจกรรม</p>
            <p className="text-sm mt-1">รอครูประกาศกิจกรรมได้เลยครับ</p>
          </div>
        ) : challenges.map(c => {
          const st = statusConfig[c.my_status];
          return (
            <div key={c.id} onClick={() => navigate(`/student/challenges/${c.id}`)}
              className="card mb-3 flex items-center justify-between cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex-1 min-w-0">
                {st && (
                  <span className={`badge text-xs mb-2 ${st.cls}`}>{st.emoji} {st.label}</span>
                )}
                {!st && (
                  <span className="badge text-xs mb-2 bg-primary/10 text-primary">🆕 ใหม่!</span>
                )}
                <h3 className="font-bold text-gray-800 truncate">{c.title}</h3>
                {c.description && <p className="text-sm text-gray-400 mt-0.5 truncate">{c.description}</p>}
                {c.deadline && (
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                    <Clock size={12}/>
                    หมดเขต {new Date(c.deadline).toLocaleDateString('th-TH', { weekday:'short', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}
                  </p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow transition-all ${c.my_status === 'graded' ? 'bg-green-500' : c.my_status ? 'bg-yellow-400' : 'bg-primary group-hover:scale-110'}`}>
                  <ChevronRight size={18}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
