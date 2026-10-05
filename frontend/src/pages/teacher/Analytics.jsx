import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../lib/api';

const COLORS = ['#22C55E', '#EF4444', '#9CA3AF'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/class').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"/></div>;
  if (!data) return <div className="card text-center text-gray-500">ไม่พบข้อมูล</div>;

  const { summary, challengeStats = [], performance, reflectionStats, dailySubmissions = [] } = data;

  const submissionPie = [
    { name: 'ตรงเวลา', value: summary.onTime },
    { name: 'ล่าช้า', value: summary.late },
    { name: 'ยังไม่ส่ง', value: summary.notStarted + summary.inProgress },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">📊 Learning Analytics</h1>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'คะแนนเฉลี่ย', value: `${performance?.avgScore || 0}`, unit: '/100', color: 'text-primary' },
          { label: 'สูงสุด', value: `${performance?.maxScore || 0}`, unit: '/100', color: 'text-success' },
          { label: 'ต่ำสุด', value: `${performance?.minScore || 0}`, unit: '/100', color: 'text-danger' },
          { label: 'ความตั้งใจเฉลี่ย', value: reflectionStats?.avgSelfScore || 0, unit: '/5', color: 'text-accent' },
        ].map((s, i) => (
          <div key={i} className="card text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}<span className="text-base font-normal text-gray-400">{s.unit}</span></p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Submission Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-lg mb-4">สัดส่วนการส่งงาน</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={submissionPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {submissionPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-bold text-lg mb-4">คะแนนเฉลี่ยรายชาเลนจ์</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={challengeStats} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="title" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(0, 12) + '…'} />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(v) => [`${v} คะแนน`, 'เฉลี่ย']} />
              <Bar dataKey="avgScore" fill="#5B5FEF" radius={[6, 6, 0, 0]} name="คะแนนเฉลี่ย" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Challenge Table */}
      <div className="card overflow-x-auto">
        <h3 className="font-bold text-lg mb-4">สถิติรายชาเลนจ์</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="text-left p-3 rounded-l-lg">ชาเลนจ์</th>
              <th className="text-center p-3">ระดับ</th>
              <th className="text-center p-3">ส่งแล้ว</th>
              <th className="text-center p-3">ตรงเวลา</th>
              <th className="text-center p-3">ล่าช้า</th>
              <th className="text-center p-3 rounded-r-lg">เฉลี่ย</th>
            </tr>
          </thead>
          <tbody>
            {challengeStats.map((c, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-800 max-w-[180px] truncate">{c.title}</td>
                <td className="p-3 text-center">
                  <span className={`badge text-xs ${c.difficulty === 'hard' ? 'bg-red-100 text-red-600' : c.difficulty === 'easy' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {c.difficulty === 'hard' ? 'ยาก' : c.difficulty === 'easy' ? 'ง่าย' : 'ปานกลาง'}
                  </span>
                </td>
                <td className="p-3 text-center font-semibold">{c.submittedCount}/{c.totalEnrolled}</td>
                <td className="p-3 text-center text-success font-semibold">{c.onTimeCount}</td>
                <td className="p-3 text-center text-danger font-semibold">{c.lateCount}</td>
                <td className="p-3 text-center">
                  <span className={`font-bold ${c.avgScore >= 80 ? 'text-success' : c.avgScore >= 60 ? 'text-warning' : 'text-danger'}`}>
                    {c.avgScore || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Daily Submissions Trend */}
      {dailySubmissions.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-lg mb-4">แนวโน้มการส่งงานรายวัน (30 วันล่าสุด)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailySubmissions}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#5B5FEF" strokeWidth={2} name="ส่งงาน" dot={false} />
              <Line type="monotone" dataKey="on_time_count" stroke="#22C55E" strokeWidth={2} name="ตรงเวลา" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
