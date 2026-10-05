import React from 'react';
import { Bell } from 'lucide-react';

export default function Notifications() {
  const notifs = [
    { id: 1, title: 'ส่งงานใหม่', desc: 'สมชายส่งงาน UI Design', time: '10 นาทีที่แล้ว', read: false },
    { id: 2, title: 'ส่งงานล่าช้า', desc: 'มานะส่งงาน HTML ล่าช้า', time: '1 ชั่วโมงที่แล้ว', read: true },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-3xl font-bold">แจ้งเตือน (Teacher)</h1>
        <button className="text-primary text-sm font-medium">ทำเครื่องหมายว่าอ่านแล้วทั้งหมด</button>
      </div>
      
      {notifs.map(n => (
        <div key={n.id} className={`card !p-4 flex gap-4 items-start ${!n.read ? 'bg-primary/5 border border-primary/20' : ''}`}>
          <div className="p-2 bg-primary/10 rounded-full text-primary mt-1"><Bell size={20}/></div>
          <div>
            <h3 className={`font-bold ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h3>
            <p className="text-gray-600 text-sm mt-1">{n.desc}</p>
            <p className="text-xs text-gray-400 mt-2">{n.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
