import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isTeacher = role === 'teacher';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password: password.trim() });
      const { token, user } = res.data || {};
      if (!user || !token) {
        throw new Error('ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง');
      }
      if (user.role !== role) {
        setError(`บัญชีนี้เป็น "${user.role === 'teacher' ? 'ครูผู้สอน' : 'นักเรียน'}" กรุณาเลือกแท็บ "${user.role === 'teacher' ? 'ครูผู้สอน' : 'นักเรียน'}" ด้านบนก่อน`);
        setLoading(false);
        return;
      }
      login(user, token);
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/home');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    if (isTeacher) {
      setUsername('Teacheradmin');
      setPassword('teacheradmin101');
    } else {
      setUsername('69219100001');
      setPassword('69219100001');
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 40%, #DBEAFE 100%)' }}>

      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(circle, #C7D2FE, transparent)' }}/>
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-20 translate-x-1/3 translate-y-1/3"
        style={{ background: 'radial-gradient(circle, #BFDBFE, transparent)' }}/>

      {/* Role Toggle — top left */}
      <div className="absolute top-6 left-6">
        <div className="flex bg-white/70 backdrop-blur-sm rounded-full p-1 shadow-sm border border-white/80">
          <button onClick={() => { setRole('student'); setError(''); setUsername(''); setPassword(''); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${role === 'student' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            นักเรียน
          </button>
          <button onClick={() => { setRole('teacher'); setError(''); setUsername(''); setPassword(''); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${role === 'teacher' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            ครูผู้สอน
          </button>
        </div>
      </div>

      {/* Icon */}
      <div className="mb-6 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
        {isTeacher ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 5-3.5 9.5-9 11-5.5-1.5-9-6-9-11a12.08 12.08 0 012.84-1.422L12 14z"/>
          </svg>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        {isTeacher ? 'Teacher Portal' : 'Student Portal'} <span>✨</span>
      </h1>
      <p className="text-blue-500 text-sm text-center mb-8">
        {isTeacher
          ? 'ระบบจัดการห้องเรียน CBL · ยืนยันตัวตนเพื่อเข้าสู่ระบบ'
          : 'ระบบการเรียนรู้แบบ Challenge-Based Learning'}
      </p>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-blue-100/50 p-8 border border-white">

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {isTeacher ? 'Username' : 'รหัสนักเรียน'}
            </label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus-within:border-blue-400 focus-within:bg-white transition-all">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus autoComplete="username"
                placeholder={isTeacher ? 'กรอก Teacheradmin' : 'กรอกรหัสนักเรียน 11 หลัก'}
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-300"/>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Password (รหัสผ่าน)
            </label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus-within:border-blue-400 focus-within:bg-white transition-all">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder={isTeacher ? '••••••••' : 'รหัสเดียวกับรหัสนักเรียน'}
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Quick-fill helper */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-gray-400">
              {isTeacher ? 'บัญชีครู: Teacheradmin' : 'นักเรียน: 69219100001'}
            </span>
            <button
              type="button"
              onClick={fillDemoAccount}
              className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
            >
              กดเพื่อใส่รหัสตัวอย่าง
            </button>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 mt-3 hover:opacity-95 cursor-pointer"
            style={{ background: loading ? '#93C5FD' : 'linear-gradient(135deg, #3B82F6, #2563EB)', boxShadow: '0 4px 20px rgba(59,130,246,0.4)' }}>
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                เข้าสู่ระบบ
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Hint */}
        <p className="text-center text-xs text-gray-400 mt-5">
          {isTeacher
            ? 'ใช้ Username: Teacheradmin และ Password: teacheradmin101'
            : 'Username และ Password คือรหัสนักเรียน 11 หลักของคุณ'}
        </p>
      </div>

      {/* Version */}
      <p className="mt-8 text-xs text-gray-400">CBL Challenge Classroom · ปวช.1</p>
    </div>
  );
}
