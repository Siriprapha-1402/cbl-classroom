import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, Inbox, LogOut, UsersRound, ClipboardCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function TeacherLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { to: '/teacher/dashboard',   icon: <LayoutDashboard size={20}/>, label: 'ภาพรวม' },
    { to: '/teacher/challenges',  icon: <BookOpen size={20}/>,        label: 'จัดการกิจกรรม' },
    { to: '/teacher/groups',      icon: <UsersRound size={20}/>,      label: 'จัดกลุ่ม' },
    { to: '/teacher/submissions', icon: <Inbox size={20}/>,           label: 'ผลงานนักเรียน' },
    { to: '/teacher/assessments', icon: <ClipboardCheck size={20}/>,  label: 'แบบประเมินวิจัย' },
    { to: '/teacher/students',    icon: <Users size={20}/>,           label: 'รายชื่อนักเรียน' },
  ];

  return (
    <div className="flex h-screen bg-cbg">
      <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-5 text-center border-b border-slate-700">
          <div className="w-14 h-14 bg-primary rounded-full mx-auto flex items-center justify-center text-2xl mb-2">👩‍🏫</div>
          <h2 className="font-bold text-sm">{user?.name || 'Teacher'}</h2>
          <span className="text-slate-400 text-xs">ครูผู้สอน</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800'}`
              }>
              {item.icon}<span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm">
            <LogOut size={18}/> ออกจากระบบ
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white shadow-sm flex items-center px-6">
          <span className="text-2xl mr-2">🎯</span>
          <h1 className="font-bold text-gray-800">CBL Classroom</h1>
          <span className="text-gray-400 text-sm ml-2">— ระบบจัดการกิจกรรม</span>
        </header>
        <div className="flex-1 overflow-auto p-6"><Outlet/></div>
      </main>
    </div>
  );
}
