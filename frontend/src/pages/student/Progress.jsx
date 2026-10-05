import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../lib/api';

const LEVELS = [
  { level: 1, name: 'ผู้เริ่มต้น', min: 0, max: 200 },
  { level: 2, name: 'นักสำรวจ', min: 200, max: 500 },
  { level: 3, name: 'นักสร้างสรรค์', min: 500, max: 1000 },
  { level: 4, name: 'นักแก้ปัญหา', min: 1000, max: 1800 },
  { level: 5, name: 'ผู้เชี่ยวชาญ', min: 1800, max: 1800 },
];

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/gamification/my/progress').then(r => setProgress(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"/></div>;

  const xp = progress?.xp || 0;
  const stats = progress?.stats || {};
  const badges = progress?.badges || [];
  const xpLog = progress?.recentXP || [];
  const levelInfo = LEVELS.reduce((acc, l) => xp >= l.min ? l : acc, LEVELS[0]);
  const nextLevel = LEVELS.find(l => l.min > xp) || LEVELS[4];
  const pct = levelInfo.min === nextLevel.min ? 100 : Math.round(((xp - levelInfo.min) / (nextLevel.min - levelInfo.min)) * 100);

  // XP by source for bar chart
  const xpBySource = Object.entries(
    xpLog.reduce((acc, x) => { const k = x.reason || 'อื่นๆ'; acc[k] = (acc[k] || 0) + x.amount; return acc; }, {})
  ).map(([name, value]) => ({ name: name.slice(0, 12), value })).slice(0, 6);

  const pieData = [
    { name: 'ตรงเวลา', value: stats.onTime || 0, color: '#22C55E' },
    { name: 'ล่าช้า', value: stats.late || 0, color: '#F59E0B' },
    { name: 'ยังไม่ส่ง', value: stats.notSubmitted || 0, color: '#EF4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">ความก้าวหน้าของฉัน</h1>

      {/* Level + XP */}
      <div className="card bg-gradient-to-r from-primary to-primary-light text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm">ระดับปัจจุบัน</p>
            <p className="text-4xl font-bold">Lv.{levelInfo.level}</p>
            <p className="text-white/80">{levelInfo.name}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{xp}</p>
            <p className="text-white/70 text-sm">XP ทั้งหมด</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full bg-white transition-all" style={{ width: `${pct}%` }}/>
        </div>
        <p className="text-xs text-white/60 mt-1">
          {levelInfo.level < 5 ? `อีก ${nextLevel.min - xp} XP → Lv.${nextLevel.level} ${nextLevel.name}` : 'ระดับสูงสุดแล้ว! 🏆'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'ส่งงานแล้ว', value: stats.submitted || 0, color: 'text-primary' },
          { label: 'ตรงเวลา', value: `${stats.onTimeRate || 0}%`, color: 'text-success' },
          { label: 'คะแนนเฉลี่ย', value: stats.avgScore ? Math.round(stats.avgScore) : '—', color: 'text-accent' },
        ].map((s, i) => (
          <div key={i} className="card text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {xpBySource.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4">XP จากแหล่งต่างๆ</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={xpBySource} margin={{ left: -30 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip/>
                <Bar dataKey="value" fill="#5B5FEF" radius={[4,4,0,0]} name="XP"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {pieData.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4">สัดส่วนการส่งงาน</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs">
              {pieData.map(d => <span key={d.name} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }}/>{d.name} ({d.value})</span>)}
            </div>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4">Badges ที่ได้รับ ({badges.length})</h3>
        {badges.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">ยังไม่มี Badge — ทำกิจกรรมเพื่อรับ Badge แรกของคุณ!</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {badges.map(b => (
              <div key={b.id} className="text-center w-16" title={b.description}>
                <p className="text-4xl">{b.icon}</p>
                <p className="text-xs text-gray-600 mt-1 leading-tight">{b.name_th || b.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent XP */}
      {xpLog.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">ประวัติ XP ล่าสุด</h3>
          <div className="space-y-2">
            {xpLog.slice(0, 10).map((x, i) => (
              <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-50">
                <span className="text-gray-600">{x.reason}</span>
                <span className="font-bold text-success">+{x.amount} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
