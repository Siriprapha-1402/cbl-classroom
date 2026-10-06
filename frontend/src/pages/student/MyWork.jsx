import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import api from '../../lib/api';

export default function MyWork() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/challenges').then(r => (r.data.challenges || []).filter(c => c.my_status)).catch(() => []),
      api.get('/quizzes/my-results').then(r => r.data?.results).catch(() => null)
    ]).then(([chals, qResults]) => {
      setChallenges(chals);
      setQuizResults(qResults);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"/></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">ผลงานของฉัน</h1>
        <button
          onClick={() => navigate('/student/quizzes')}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          ทำแบบทดสอบ <ChevronRight size={14}/>
        </button>
      </div>

      {/* Quiz Results Card */}
      {quizResults && (quizResults.pre || quizResults.post) && (
        <div className="card !p-5 bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-white border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <span>📝</span> ผลการทำแบบทดสอบ (Microsoft PowerPoint)
            </h3>
            <button
              onClick={() => navigate('/student/quizzes')}
              className="text-xs text-primary font-bold hover:underline"
            >
              ดูเฉลยละเอียด
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl border border-gray-100 text-center">
              <span className="text-[11px] text-gray-400">ก่อนเรียน (Pre-test)</span>
              <p className="text-lg font-black text-amber-600">
                {quizResults.pre ? `${quizResults.pre.score}/10` : '—'}
              </p>
              <span className="text-[10px] text-gray-400">{quizResults.pre ? `${quizResults.pre.percentage}%` : 'ยังไม่ได้ทำ'}</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-100 text-center">
              <span className="text-[11px] text-gray-400">หลังเรียน (Post-test)</span>
              <p className="text-lg font-black text-emerald-600">
                {quizResults.post ? `${quizResults.post.score}/10` : '—'}
              </p>
              <span className="text-[10px] text-gray-400">{quizResults.post ? `${quizResults.post.percentage}%` : 'ยังไม่ได้ทำ'}</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-100 text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] text-gray-400">พัฒนาการ</span>
              <p className="text-lg font-black text-primary">
                {(quizResults.pre && quizResults.post) ? `+${quizResults.post.score - quizResults.pre.score}` : '—'}
              </p>
              <span className="text-[10px] text-gray-400">
                {(quizResults.pre && quizResults.post) ? `+${quizResults.post.percentage - quizResults.pre.percentage}%` : 'ทำทั้ง 2 ชุด'}
              </span>
            </div>
          </div>
        </div>
      )}

      {challenges.length === 0 ? (
        <div className="card text-center py-14 text-gray-400">
          <p className="text-4xl mb-3">📂</p>
          <p className="font-medium">ยังไม่มีผลงาน</p>
          <button onClick={() => navigate('/student/home')} className="btn-primary mt-4 text-sm">ไปหน้ากิจกรรม</button>
        </div>
      ) : challenges.map(c => (
        <div key={c.id} className="card space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-800">{c.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {c.submitted_at
                  ? `ส่งเมื่อ ${new Date(c.submitted_at).toLocaleDateString('th-TH', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}`
                  : 'ยังไม่ได้ส่ง'}
              </p>
            </div>
            {c.my_status === 'graded' ? (
              <span className="badge bg-green-100 text-green-700 text-xs">✅ ตรวจแล้ว</span>
            ) : c.my_status === 'submitted' ? (
              <span className="badge bg-blue-100 text-blue-700 text-xs">📤 รอตรวจ</span>
            ) : (
              <span className="badge bg-yellow-100 text-yellow-700 text-xs">⏳ กำลังทำ</span>
            )}
          </div>

          {/* Score */}
          {c.my_status === 'graded' && (
            <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-4">
              <div className="text-center w-20 flex-shrink-0">
                <p className={`text-4xl font-bold ${(c.score||0) >= 80 ? 'text-green-600' : (c.score||0) >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {c.score ?? '—'}
                </p>
                <p className="text-xs text-gray-400">/{c.max_score || 100} คะแนน</p>
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full ${(c.score||0) >= 80 ? 'bg-green-500' : (c.score||0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.round(((c.score||0) / (c.max_score||100)) * 100)}%` }}/>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {(c.score||0) >= 80 ? '🌟 ยอดเยี่ยม!' : (c.score||0) >= 60 ? '👍 ดีมาก' : '💪 ต้องพัฒนาต่อ'}
                </p>
              </div>
            </div>
          )}

          {/* Feedback */}
          {c.feedback_comment && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-500 mb-1 flex items-center gap-1">
                <MessageSquare size={12}/> Feedback จากครู
              </p>
              <p className="text-sm text-blue-900">{c.feedback_comment}</p>
            </div>
          )}

          {/* On time */}
          {c.is_on_time === 1 && <p className="text-xs text-green-600">✓ ส่งตรงเวลา</p>}
          {c.is_on_time === 0 && <p className="text-xs text-red-500">⚠ ส่งล่าช้า</p>}

          {/* Continue button */}
          {c.my_status === 'in_progress' && (
            <button onClick={() => navigate(`/student/challenges/${c.id}`)}
              className="btn-primary text-sm py-2.5 w-full flex items-center justify-center gap-2">
              ▶ ทำกิจกรรมต่อ <ChevronRight size={16}/>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
