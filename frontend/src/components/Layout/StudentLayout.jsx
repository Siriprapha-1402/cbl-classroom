import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, LogOut, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function StudentLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { to: '/student/home',    icon: <Home size={20}/>,    label: 'กิจกรรม' },
    { to: '/student/groups',  icon: <Users size={20}/>,   label: 'กลุ่มของฉัน' },
    { to: '/student/my-work', icon: <FolderOpen size={20}/>, label: 'ผลงานของฉัน' },
  ];

  return (
    <div className="flex h-screen bg-cbg">
      <aside className="w-56 bg-white shadow-lg flex flex-col">
        <div className="p-5 text-center border-b border-gray-100">
          <div className="w-14 h-14 bg-primary/10 rounded-full mx-auto flex items-center justify-center text-2xl mb-2">👨‍🎓</div>
          <h2 className="font-bold text-sm text-gray-800 leading-tight">{user?.name || 'Student'}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{user?.student_id || user?.username}</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${isActive ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-primary'}`
              }>
              {item.icon}<span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-gray-50 text-sm">
            <LogOut size={18}/> ออกจากระบบ
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white shadow-sm flex items-center px-6">
          <span className="text-2xl mr-2">🚀</span>
          <h1 className="font-bold text-gray-800">CBL Classroom</h1>
        </header>
        <div className="flex-1 overflow-auto p-6"><Outlet/></div>
      </main>
    </div>
  );
}
