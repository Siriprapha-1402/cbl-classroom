import React from 'react';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const comparisonData = [
  { name: 'ความตรงต่อเวลา', ก่อน: 60, หลัง: 95 },
  { name: 'คะแนนเฉลี่ย', ก่อน: 70, หลัง: 85 },
];

export default function ResearchData() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ข้อมูลสำหรับการวิจัย</h1>
          <p className="text-gray-500">เปรียบเทียบผลสัมฤทธิ์ก่อนและหลังใช้ระบบ Gamification</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download size={20} /> Export Excel
        </button>
      </div>

      <div className="card h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="ก่อน" fill="#9CA3AF" name="ก่อนใช้ระบบ" />
            <Bar dataKey="หลัง" fill="#22C55E" name="หลังใช้ระบบ" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-warning/10 text-warning-800 p-4 rounded-xl border border-warning/20">
        <strong>หมายเหตุ:</strong> ข้อมูล XP และ Badge เป็นข้อมูลประกอบการตัดสินใจ ไม่ใช่ตัวแทนของผลสัมฤทธิ์โดยตรง
      </div>
    </div>
  );
}
