import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  TrendingUp, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  HelpCircle, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import api from '../../lib/api';
import { POWERPOINT_QUIZ_QUESTIONS } from '../../data/quizQuestions';

const CHOICE_LETTERS = ['ก', 'ข', 'ค', 'ง'];

export default function StudentQuizzes() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ pre: null, post: null });
  
  // State การทำแบบทดสอบ
  const [activeQuizType, setActiveQuizType] = useState(null); // 'pre' | 'post' | null
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: optionIndex }
  const [submitting, setSubmitting] = useState(false);
  const [reviewMode, setReviewMode] = useState(null); // 'pre' | 'post' | null
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // โหลดผลการทำแบบทดสอบ
  const loadMyResults = async () => {
    try {
      const res = await api.get('/quizzes/my-results');
      if (res.data?.results) {
        setResults(res.data.results);
      }
    } catch (err) {
      console.error('Error fetching quiz results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyResults();
  }, []);

  // เริ่มทำแบบทดสอบ
  const handleStartQuiz = (type) => {
    setActiveQuizType(type);
    setCurrentQIndex(0);
    setUserAnswers({});
    setReviewMode(null);
  };

  // เลือกคำตอบ
  const handleSelectOption = (qId, optionIdx) => {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  // ตรวจสอบจำนวนข้อที่ตอบแล้ว
  const answeredCount = Object.keys(userAnswers).length;
  const totalQuestions = POWERPOINT_QUIZ_QUESTIONS.length;
  const currentQuestion = POWERPOINT_QUIZ_QUESTIONS[currentQIndex];

  // ยืนยันการส่งแบบทดสอบ
  const handleSubmitQuiz = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const res = await api.post('/quizzes/submit', {
        quizType: activeQuizType,
        answers: userAnswers
      });

      await loadMyResults();
      // เปลี่ยนเป็นโหมดดูผลการสอบทันที
      setReviewMode(activeQuizType);
      setActiveQuizType(null);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการส่งคำตอบ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"/>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. หน้าจอขณะกำลังทำแบบทดสอบ (ACTIVE QUIZ VIEW)
  // ═══════════════════════════════════════════════════════════════════════════
  if (activeQuizType) {
    const isPre = activeQuizType === 'pre';
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Quiz Header Bar */}
        <div className="card !p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-primary/20 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isPre ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {isPre ? '📝 แบบทดสอบก่อนเรียน' : '🎓 แบบทดสอบหลังเรียน'}
              </span>
              <span className="text-xs text-gray-400 font-medium">วิชาโปรแกรมนำเสนอ</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mt-1">
              {isPre ? 'Pre-test: ความรู้พื้นฐานก่อนเรียน' : 'Post-test: วัดผลสัมฤทธิ์หลังเรียน'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการออกจากการทำแบบทดสอบหรือไม่? คำตอบที่ทำไว้จะไม่ถูกบันทึก')) {
                  setActiveQuizType(null);
                }
              }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <FileCheck2 size={15}/> ส่งคำตอบ ({answeredCount}/{totalQuestions})
            </button>
          </div>
        </div>

        {/* Progress Bar & Question Tabs */}
        <div className="card !p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500">
            <span>ความคืบหน้า: ทำแล้ว {answeredCount} จาก {totalQuestions} ข้อ</span>
            <span className="font-bold text-primary">{Math.round((answeredCount / totalQuestions) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>

          {/* Quick Question Navigator Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
            {POWERPOINT_QUIZ_QUESTIONS.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCurrent = idx === currentQIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                    isCurrent
                      ? 'bg-primary text-white ring-2 ring-primary/40 shadow-sm'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        <div className="card !p-6 space-y-5 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200/60">
                ข้อที่ {currentQIndex + 1} จาก {totalQuestions}
              </span>
              <span className="text-xs text-gray-400 font-medium">หัวข้อ: {currentQuestion.topic}</span>
            </div>
            <h3 className="text-base font-bold text-gray-800 pt-2 leading-relaxed">
              {currentQuestion.question}
            </h3>
          </div>

          {/* 4 Choices */}
          <div className="space-y-2.5 pt-2">
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = userAnswers[currentQuestion.id] === optIdx;
              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-primary/5 border-primary ring-2 ring-primary/30 shadow-xs'
                      : 'bg-white border-gray-200 hover:bg-slate-50 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isSelected ? 'bg-primary text-white shadow-xs' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {CHOICE_LETTERS[optIdx]}
                  </div>
                  <span className={`text-sm ${isSelected ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                    {opt}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold transition disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
            >
              <ChevronLeft size={16}/> ข้อก่อนหน้า
            </button>

            {currentQIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1"
              >
                ข้อถัดไป <ChevronRight size={16}/>
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1"
              >
                <CheckCircle2 size={16}/> ตรวจทานและส่งคำตอบ
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-scale-up">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
                <FileCheck2 size={24}/>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 text-base">ยืนยันการส่งแบบทดสอบ?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  คุณตอบไปแล้ว <span className="font-bold text-primary">{answeredCount}</span> จากทั้งหมด <span className="font-bold">{totalQuestions}</span> ข้อ
                </p>
                {answeredCount < totalQuestions && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                    ⚠️ ยังมีข้อที่ยังไม่ได้ตอบอีก {totalQuestions - answeredCount} ข้อ ต้องการส่งทันทีหรือไม่?
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition"
                >
                  กลับไปทำต่อ
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'กำลังส่ง...' : 'ยืนยันการส่ง'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. หน้าจอเฉลยและตรวจทานผลสอบ (REVIEW VIEW)
  // ═══════════════════════════════════════════════════════════════════════════
  if (reviewMode) {
    const isPre = reviewMode === 'pre';
    const currentRes = results[reviewMode];
    const userAnsMap = currentRes?.answers || {};

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Summary */}
        <div className="card !p-6 bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPre ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {isPre ? '📝 เฉลยแบบทดสอบก่อนเรียน (Pre-test)' : '🎓 เฉลยแบบทดสอบหลังเรียน (Post-test)'}
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-2">
                คะแนนที่ได้: <span className="text-primary">{currentRes?.score || 0}</span> / {currentRes?.total_score || 10} คะแนน
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                คิดเป็น {currentRes?.percentage || 0}% · ส่งเมื่อ {currentRes?.submitted_at ? new Date(currentRes.submitted_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
              </p>
            </div>

            <button
              onClick={() => setReviewMode(null)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 self-start sm:self-center"
            >
              กลับสู่หน้ารวมแบบทดสอบ <ArrowRight size={14}/>
            </button>
          </div>
        </div>

        {/* 10 Questions Detailed Review */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <BookOpen size={18} className="text-primary"/> ตรวจสอบคำตอบและคำอธิบาย (10 ข้อ)
          </h3>

          {POWERPOINT_QUIZ_QUESTIONS.map((q, idx) => {
            const userChoice = userAnsMap[q.id] !== undefined ? Number(userAnsMap[q.id]) : null;
            const isCorrect = userChoice === q.correctAnswer;

            return (
              <div key={q.id} className="card !p-5 space-y-3 border-gray-200 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400">ข้อที่ {idx + 1} · {q.topic}</span>
                    <h4 className="font-bold text-gray-900 text-sm">{q.question}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 flex-shrink-0 ${
                    isCorrect ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {isCorrect ? <CheckCircle2 size={13}/> : <XCircle size={13}/>}
                    {isCorrect ? 'ถูกต้อง (+1)' : 'ไม่ถูกต้อง (0)'}
                  </span>
                </div>

                {/* Choices list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isUserPick = userChoice === optIdx;
                    const isRightAnswer = q.correctAnswer === optIdx;

                    let badgeCls = 'bg-slate-50 border-gray-200 text-gray-600';
                    if (isRightAnswer) badgeCls = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                    else if (isUserPick && !isCorrect) badgeCls = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold';

                    return (
                      <div key={optIdx} className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${badgeCls}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isRightAnswer ? 'bg-emerald-600 text-white' : isUserPick ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {CHOICE_LETTERS[optIdx]}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isRightAnswer && <span className="text-[10px] font-bold text-emerald-700">✓ เฉลย</span>}
                        {isUserPick && !isRightAnswer && <span className="text-[10px] font-bold text-rose-700">คำตอบของคุณ</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 space-y-0.5">
                  <span className="font-bold flex items-center gap-1 text-amber-800">
                    <Sparkles size={13}/> คำอธิบาย:
                  </span>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. หน้ารวมแบบทดสอบ (MAIN OVERVIEW VIEW)
  // ═══════════════════════════════════════════════════════════════════════════
  const preRes = results.pre;
  const postRes = results.post;
  const bothCompleted = preRes && postRes;
  const gainScore = bothCompleted ? postRes.score - preRes.score : 0;
  const gainPercentage = bothCompleted ? postRes.percentage - preRes.percentage : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2 text-white/80 text-xs font-bold">
          <BookOpen size={16}/> รายวิชาโปรแกรมนำเสนอ (Microsoft PowerPoint) · ปวช.1
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">แบบทดสอบก่อนเรียน & หลังเรียน</h1>
        <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-xl">
          ทดสอบความรู้ความเข้าใจเกี่ยวกับการใช้งานโปรแกรม Microsoft PowerPoint จำนวน 10 ข้อ 
          เพื่อวัดผลสัมฤทธิ์และพัฒนาการทางการเรียนรู้ของคุณ
        </p>
      </div>

      {/* Growth Comparison Card (ถ้าทำครบทั้ง 2 แบบทดสอบ) */}
      {bothCompleted && (
        <div className="card !p-6 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white border-emerald-300 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1.5">
              <TrendingUp size={14}/> พัฒนาการทางการเรียนรู้ (Learning Growth)
            </span>
            <span className="text-xs font-bold text-emerald-700">
              {gainScore >= 0 ? `+${gainScore} คะแนน` : `${gainScore} คะแนน`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-4 bg-white rounded-2xl border border-gray-200 text-center space-y-1">
              <span className="text-xs text-gray-400 font-medium">ก่อนเรียน (Pre-test)</span>
              <p className="text-2xl font-black text-amber-600">{preRes.score} / 10</p>
              <span className="text-[11px] text-gray-500">{preRes.percentage}%</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-200 text-center space-y-1">
              <span className="text-xs text-gray-400 font-medium">หลังเรียน (Post-test)</span>
              <p className="text-2xl font-black text-emerald-600">{postRes.score} / 10</p>
              <span className="text-[11px] text-gray-500">{postRes.percentage}%</span>
            </div>

            <div className="p-4 bg-emerald-600 text-white rounded-2xl text-center space-y-1 shadow-md flex flex-col justify-center">
              <span className="text-xs text-white/80 font-medium">พัฒนาการเพิ่มขึ้น</span>
              <p className="text-2xl font-black">
                {gainScore >= 0 ? `+${gainPercentage}%` : `${gainPercentage}%`}
              </p>
              <span className="text-[11px] text-white/80">
                {gainScore > 0 ? 'ยอดเยี่ยมมาก! มีพัฒนาการที่ดีขึ้น' : 'มีความรู้ความเข้าใจในเนื้อหา'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Two Quiz Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CARD 1: Pre-test (ก่อนเรียน) */}
        <div className={`card !p-6 space-y-5 border-2 transition-all flex flex-col justify-between ${
          preRes ? 'border-amber-200 bg-amber-50/20 shadow-xs' : 'border-slate-200 hover:shadow-md'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                📝
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                preRes ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {preRes ? '✓ ทำแล้ว' : 'ยังไม่ได้ทำ'}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-lg">แบบทดสอบก่อนเรียน</h3>
              <p className="text-xs text-gray-400 font-medium">Pre-test · 10 ข้อ · 4 ตัวเลือก</p>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              ทำแบบทดสอบเพื่อประเมินความรู้พื้นฐานเกี่ยวกับโปรแกรม Microsoft PowerPoint ก่อนเริ่มเข้าสู่บทเรียน
            </p>

            {preRes && (
              <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">คะแนนที่ได้</span>
                  <p className="text-lg font-black text-amber-700">{preRes.score} / 10 <span className="text-xs font-normal text-gray-400">({preRes.percentage}%)</span></p>
                </div>
                <span className="text-[11px] text-gray-400">
                  {new Date(preRes.submitted_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
            {preRes ? (
              <>
                <button
                  onClick={() => setReviewMode('pre')}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <BookOpen size={14}/> ดูเฉลยและคำอธิบาย
                </button>
                <button
                  onClick={() => handleStartQuiz('pre')}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                  title="ทำแบบทดสอบใหม่อีกครั้ง"
                >
                  <RotateCcw size={14}/>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleStartQuiz('pre')}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
              >
                เริ่มทำแบบทดสอบก่อนเรียน <ArrowRight size={14}/>
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: Post-test (หลังเรียน) */}
        <div className={`card !p-6 space-y-5 border-2 transition-all flex flex-col justify-between ${
          postRes ? 'border-emerald-200 bg-emerald-50/20 shadow-xs' : 'border-slate-200 hover:shadow-md'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                🎓
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                postRes ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {postRes ? '✓ ทำแล้ว' : 'ยังไม่ได้ทำ'}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-lg">แบบทดสอบหลังเรียน</h3>
              <p className="text-xs text-gray-400 font-medium">Post-test · 10 ข้อ · 4 ตัวเลือก</p>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              ทำแบบทดสอบชุดเดียวกันหลังเสร็จสิ้นการเรียนรู้และปฏิบัติกิจกรรม เพื่อประเมินผลสัมฤทธิ์ทางการเรียน
            </p>

            {postRes && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">คะแนนที่ได้</span>
                  <p className="text-lg font-black text-emerald-700">{postRes.score} / 10 <span className="text-xs font-normal text-gray-400">({postRes.percentage}%)</span></p>
                </div>
                <span className="text-[11px] text-gray-400">
                  {new Date(postRes.submitted_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
            {postRes ? (
              <>
                <button
                  onClick={() => setReviewMode('post')}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <BookOpen size={14}/> ดูเฉลยและคำอธิบาย
                </button>
                <button
                  onClick={() => handleStartQuiz('post')}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                  title="ทำแบบทดสอบใหม่อีกครั้ง"
                >
                  <RotateCcw size={14}/>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleStartQuiz('post')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
              >
                เริ่มทำแบบทดสอบหลังเรียน <ArrowRight size={14}/>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
        <HelpCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5"/>
        <div>
          <span className="font-bold">ข้อมูลโครงสร้างแบบทดสอบ:</span> แบบทดสอบก่อนเรียนและหลังเรียนเป็นข้อสอบชุดเดียวกันจำนวน 10 ข้อ 
          ครอบคลุมเนื้อหา: ลักษณะของโปรแกรม, การเรียกใช้, ส่วนประกอบหน้าต่าง, เค้าโครงและ Placeholder, มุมมองสไลด์, การนำเสนอ, สไลด์ต้นแบบและเทมเพลต, การจัดการและตกแต่งสไลด์, การแทรกและจัดวางข้อความ ย่อหน้า และกรอบข้อความ
        </div>
      </div>
    </div>
  );
}
