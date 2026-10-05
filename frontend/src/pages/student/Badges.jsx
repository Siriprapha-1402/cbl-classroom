import React from 'react';
import BadgeCard from '../../components/UI/BadgeCard';

const BADGES = [
  { id: 1, name: 'First Blood', description: 'ส่งงานชิ้นแรกสำเร็จ', icon: '🎯', earnedAt: '2023-10-01' },
  { id: 2, name: 'On Time Ninja', description: 'ส่งงานตรงเวลาติดต่อกัน 3 ครั้ง', icon: '⚡', earnedAt: '2023-10-15' },
  { id: 3, name: 'Perfect Score', description: 'ได้คะแนนเต็ม 100%', icon: '⭐', earnedAt: null },
  { id: 4, name: 'Team Player', description: 'ทำงานกลุ่มสำเร็จด้วยดี', icon: '🤝', earnedAt: null },
  { id: 5, name: 'Creative Mind', description: 'ได้คำชมด้านความคิดสร้างสรรค์', icon: '💡', earnedAt: '2023-10-20' },
  { id: 6, name: 'Master Explorer', description: 'ทำภารกิจครบ 10 ภารกิจ', icon: '🚀', earnedAt: null },
];

export default function Badges() {
  const earnedCount = BADGES.filter(b => b.earnedAt).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">หอเกียรติยศ (Badges)</h1>
        <p className="text-gray-500">คุณสะสมเหรียญตราได้ {earnedCount} จาก {BADGES.length} เหรียญ</p>
        
        <div className="w-full max-w-md mx-auto mt-6 bg-gray-100 rounded-full h-3">
          <div 
            className="bg-accent h-3 rounded-full transition-all duration-1000" 
            style={{ width: `${(earnedCount / BADGES.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {BADGES.map(badge => (
          <BadgeCard key={badge.id} badge={badge} earned={!!badge.earnedAt} />
        ))}
      </div>
    </div>
  );
}
