import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { getLevelInfo } from '../../lib/utils';
import LevelBadge from '../../components/UI/LevelBadge';
import ProgressBar from '../../components/UI/ProgressBar';
import { LogOut, Settings, Award, BookOpen, Clock } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const levelInfo = getLevelInfo(user?.xp || 450);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary to-primary-light"></div>
        
        <div className="relative z-10">
          <div className="w-32 h-32 mx-auto bg-white rounded-full p-2 shadow-lg mb-4 mt-8">
            <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center text-6xl">
              👨‍🎓
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800">{user?.name || 'Student Name'}</h1>
          <p className="text-gray-500 mb-4">รหัสนักศึกษา: 6620101001 • ปวช.1 เทคโนโลยีสารสนเทศ</p>
          
          <div className="flex justify-center mb-6">
            <LevelBadge xp={user?.xp || 450} size="lg" />
          </div>

          <div className="max-w-md mx-auto">
            <ProgressBar 
              value={user?.xp || 450} 
              max={levelInfo.nextLevelXP} 
              showLabel={true} 
              label={`XP: ${user?.xp || 450} / ${levelInfo.nextLevelXP}`}
              color="bg-accent"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <BookOpen className="mx-auto text-primary mb-2" size={32} />
          <h3 className="text-2xl font-bold text-gray-800">10</h3>
          <p className="text-sm text-gray-500">ภารกิจที่ทำสำเร็จ</p>
        </div>
        <div className="card text-center">
          <Clock className="mx-auto text-success mb-2" size={32} />
          <h3 className="text-2xl font-bold text-gray-800">95%</h3>
          <p className="text-sm text-gray-500">ส่งตรงเวลา</p>
        </div>
        <div className="card text-center">
          <Award className="mx-auto text-accent mb-2" size={32} />
          <h3 className="text-2xl font-bold text-gray-800">3</h3>
          <p className="text-sm text-gray-500">Badges ที่ได้รับ</p>
        </div>
      </div>

      {/* Actions */}
      <div className="card space-y-2">
        <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors font-medium">
          <Settings size={20} className="text-gray-400" /> ตั้งค่าบัญชี
        </button>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-danger/5 text-danger transition-colors font-medium"
        >
          <LogOut size={20} /> ออกจากระบบ
        </button>
      </div>

    </div>
  );
}
