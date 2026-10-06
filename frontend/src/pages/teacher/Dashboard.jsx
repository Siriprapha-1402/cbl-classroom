import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import api from '../../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [summary, setSummary] = useState({});
  const [totalStudents, setTotalStudents] = useState(43);
  const [liveActivity, setLiveActivity] = useState({ activeCount: 0, inProgressCount: 0, notStartedCount: 0, submittedCount: 0 });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = React.useCallback(async () => {
    try {
      const [cRes, aRes, sRes] = await Promise.all([
        api.get('/challenges').catch(() => ({ data: { challenges: [] } })),
        api.get('/analytics/class').catch(() => ({ data: {} })),
        api.get('/students').catch(() => ({ data: { students: [] } }))
      ]);
      const cList = cRes.data?.challenges || [];
      const sList = sRes.data?.students || [];
      const aData = aRes.data || {};
      const aSummary = aData.summary || {};

      const studentCount = sList.length || aSummary.totalStudents || aData.totalStudents || 43;
      setTotalStudents(studentCount);
      setChallenges(cList);

      setSummary({
        totalStudents: studentCount,
        submitted: aSummary.submitted || 0,
        onTime: aSummary.onTime || 0,
        late: aSummary.late || 0,
        notStarted: aSummary.notStarted !== undefined ? aSummary.notStarted : (cList.length > 0 ? Math.max(0, studentCount * cList.length - (aSummary.submitted || 0)) : 0),
      });

      // Load live activity if there's any challenge
      if (cList.length > 0) {
        const actRes = await api.get(`/groups/activity/${cList[0].id}`).catch(() => null);
        if (actRes?.data) setLiveActivity(actRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    let bc;
    try {
      bc = new BroadcastChannel('cbl_channel');
      bc.onmessage = () => loadDashboardData();
    } catch (e) {}

    const handleSync = (e) => {
      if (!e?.key || e.key === 'cbl_mock_db_clean_v6') loadDashboardData();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('cbl_storage_update', handleSync);
    const interval = setInterval(loadDashboardData, 5000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('cbl_storage_update', handleSync);
      clearInterval(interval);
    };
  }, [loadDashboardData]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"/></div>;

  const cards = [
    { label: 'นักเรียนทั้งหมด', value: totalStudents, icon: '👨‍🎓', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { label: 'ส่งงานแล้ว',       value: summary.submitted || 0,      icon: '✅', color: 'bg-green-50 border-green-200 text-green-700' },
    { label: 'ยังไม่ส่ง',        value: summary.notStarted || 0,     icon: '⏳', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { label: 'ล่าช้า',           value: summary.late || 0,           icon: '⚠️', color: 'bg-red-50 border-red-200 text-red-700' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ภาพรวมห้องเรียน</h1>
          <p className="text-gray-400 text-sm mt-0.5">ปวช.1/1 · นักเรียนทั้งหมด {totalStudents} คน · วิชาโปรแกรมนำเสนอ</p>
        </div>
        <button onClick={() => navigate('/teacher/challenges/create')}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={18}/> สร้างกิจกรรมใหม่
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${c.color}`}>
            <p className="text-2xl mb-1">{c.icon}</p>
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-sm font-medium opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Real-time Live Activity Widget */}
      {challenges.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"/>
              <h2 className="font-bold text-gray-800 text-sm">การทำงานของนักเรียนแบบเรียลไทม์ (Live Activity)</h2>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                ตรวจเช็คสด 🟢
              </span>
            </div>
            <button 
              onClick={() => navigate('/teacher/submissions')}
              className="text-xs text-primary font-bold hover:underline"
            >
              ดูรายชื่อและตรวจผลงานทั้งหมด →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <p className="text-[11px] font-bold text-emerald-800">🟢 กำลังทำงานตอนนี้</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{liveActivity.activeCount || 0} <span className="text-xs font-normal">คน</span></p>
            </div>
            <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
              <p className="text-[11px] font-bold text-rose-800">⚪ ยังไม่เริ่มทำ</p>
              <p className="text-2xl font-black text-rose-700 mt-1">{liveActivity.notStartedCount || Math.max(0, totalStudents - (summary.submitted || 0))} <span className="text-xs font-normal">คน</span></p>
            </div>
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
              <p className="text-[11px] font-bold text-amber-800">🟡 ทำค้างไว้</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{liveActivity.inProgressCount || 0} <span className="text-xs font-normal">คน</span></p>
            </div>
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
              <p className="text-[11px] font-bold text-blue-800">✅ ส่งงานแล้ว</p>
              <p className="text-2xl font-black text-blue-700 mt-1">{summary.submitted || 0} <span className="text-xs font-normal">คน</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Challenge List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-800">กิจกรรมทั้งหมด ({challenges.length})</h2>
          <button onClick={() => navigate('/teacher/challenges')} className="text-primary text-sm hover:underline">จัดการ →</button>
        </div>

        {challenges.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 mb-4">ยังไม่มีกิจกรรม</p>
            <button onClick={() => navigate('/teacher/challenges/create')} className="btn-primary text-sm">
              + สร้างกิจกรรมแรก
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map(c => {
              const submitted = c.submitted_count || 0;
              const total = totalStudents || summary.totalStudents || 43;
              const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
              return (
                <div key={c.id} onClick={() => navigate('/teacher/submissions')}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">{c.title}</h3>
                      <span className={`badge text-xs flex-shrink-0 ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.status === 'active' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>📤 ส่งแล้ว {submitted}/{total} คน</span>
                      {c.deadline && <span>⏱ หมดเขต {new Date(c.deadline).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}</span>}
                    </div>
                    {total > 0 && (
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${pct}%` }}/>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-primary ml-3 flex-shrink-0"/>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
