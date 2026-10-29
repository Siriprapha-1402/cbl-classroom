import React, { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Lock,
  ShieldAlert,
  Hourglass,
  Timer
} from 'lucide-react';
import api from '../../lib/api';
import { POWERPOINT_QUIZ_QUESTIONS } from '../../data/quizQuestions';

const CHOICE_LETTERS = ['ก', 'ข', 'ค', 'ง'];
const POST_TEST_DURATION = 30 * 60; // 30 นาที (1,800 วินาที)
const POST_TEST_SESSION_KEY = 'cbl_post_test_session';

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

  // State พิเศษสำหรับแบบทดสอบหลังเรียน (Post-test 30 นาที + ห้ามกดออก)
  const [timeLeft, setTimeLeft] = useState(POST_TEST_DURATION);
  const [showStartPostModal, setShowStartPostModal] = useState(false);
  const [showLeaveBlockModal, setShowLeaveBlockModal] = useState(false);
  const [isTimeUpSubmitting, setIsTimeUpSubmitting] = useState(false);

  const userAnswersRef = useRef(userAnswers);
  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

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

  // ตรวจสอบเซสชันค้างอยู่เมื่อโหลดหน้าเว็บ (ป้องกันการรีเฟรชแล้วเวลาหรือข้อสอบหาย)
  useEffect(() => {
    loadMyResults();

    try {
      const savedSession = localStorage.getItem(POST_TEST_SESSION_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.targetEndTime) {
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((parsed.targetEndTime - now) / 1000));
          if (remaining > 0) {
            // ฟื้นฟูการทำแบบทดสอบหลังเรียนที่ยังไม่หมดเวลา
            setActiveQuizType('post');
            setUserAnswers(parsed.answers || {});
            setCurrentQIndex(parsed.currentQIndex || 0);
            setTimeLeft(remaining);
          } else {
            // หมดเวลาไปแล้วระหว่างปิดหน้าจอ ให้ล้างเซสชัน
            localStorage.removeItem(POST_TEST_SESSION_KEY);
          }
        }
      }
    } catch (e) {
      console.error('Error checking saved quiz session:', e);
    }
  }, []);

  // ─── การนับเวลาถอยหลัง 30 นาทีสำหรับแบบทดสอบหลังเรียน (Post-test) ───────────
  useEffect(() => {
    if (activeQuizType !== 'post') return;

    const interval = setInterval(() => {
      try {
        const savedSession = localStorage.getItem(POST_TEST_SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          const remaining = Math.max(0, Math.floor((parsed.targetEndTime - Date.now()) / 1000));
          setTimeLeft(remaining);

          if (remaining <= 0) {
            clearInterval(interval);
            handleAutoSubmitTimeUp();
          }
          return;
        }
      } catch (_) {}

      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmitTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuizType]);

  // ─── ป้องกันการกดออกจากหน้าระหว่างทำแบบทดสอบหลังเรียน (Lock Navigation) ─────
  useEffect(() => {
    if (activeQuizType !== 'post') return;

    // 1. ดักจับปุ่ม Back/Forward ของ Browser
    window.history.pushState({ postExamLock: true }, '', window.location.href);

    const handlePopState = (e) => {
      // ดัน state กลับทันทีเพื่อไม่ให้เบราว์เซอร์เปลี่ยนหน้า
      window.history.pushState({ postExamLock: true }, '', window.location.href);
      setShowLeaveBlockModal(true);
    };

    window.addEventListener('popstate', handlePopState);

    // 2. ดักจับการปิด Tab หรือการ Refresh หน้าเว็บ
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'คุณกำลังทำแบบทดสอบหลังเรียนอยู่และมีเวลาจำกัด 30 นาที ไม่อนุญาตให้ออกจากหน้านี้!';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeQuizType]);

  // กดเริ่มทำแบบทดสอบ
  const handleStartQuiz = (type) => {
    if (type === 'post') {
      // แสดง Modal ยืนยันเงื่อนไข 30 นาที และล็อกหน้าจอ
      setShowStartPostModal(true);
    } else {
      // แบบทดสอบก่อนเรียน (Pre-test)
      setActiveQuizType('pre');
      setCurrentQIndex(0);
      setUserAnswers({});
      setReviewMode(null);
    }
  };

  // ยืนยันเริ่มทำ Post-test อย่างเป็นทางการ
  const handleConfirmStartPostQuiz = () => {
    setShowStartPostModal(false);
    const targetEndTime = Date.now() + POST_TEST_DURATION * 1000;
    const initialSession = {
      targetEndTime,
      answers: {},
      currentQIndex: 0
    };

    try {
      localStorage.setItem(POST_TEST_SESSION_KEY, JSON.stringify(initialSession));
    } catch (_) {}

    setUserAnswers({});
    setCurrentQIndex(0);
    setTimeLeft(POST_TEST_DURATION);
    setActiveQuizType('post');
    setReviewMode(null);
  };

  // เลือกคำตอบในแต่ละข้อ
  const handleSelectOption = (qId, optionIdx) => {
    setUserAnswers(prev => {
      const updated = {
        ...prev,
        [qId]: optionIdx
      };

      // บันทึกลง localStorage ทันทีเพื่อกันข้อมูลสูญหาย
      if (activeQuizType === 'post') {
        try {
          const raw = localStorage.getItem(POST_TEST_SESSION_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.answers = updated;
            localStorage.setItem(POST_TEST_SESSION_KEY, JSON.stringify(parsed));
          }
        } catch (_) {}
      }

      return updated;
    });
  };

  // เปลี่ยนข้อสอบที่กำลังดู
  const handleChangeQuestionIndex = (idx) => {
    setCurrentQIndex(idx);
    if (activeQuizType === 'post') {
      try {
        const raw = localStorage.getItem(POST_TEST_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.currentQIndex = idx;
          localStorage.setItem(POST_TEST_SESSION_KEY, JSON.stringify(parsed));
        }
      } catch (_) {}
    }
  };

  // ตรวจสอบจำนวนข้อที่ตอบแล้ว
  const answeredCount = Object.keys(userAnswers).length;
  const totalQuestions = POWERPOINT_QUIZ_QUESTIONS.length;
  const currentQuestion = POWERPOINT_QUIZ_QUESTIONS[currentQIndex];

  // ยืนยันการส่งแบบทดสอบ (ปกติ)
  const handleSubmitQuiz = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const res = await api.post('/quizzes/submit', {
        quizType: activeQuizType,
        answers: userAnswers
      });

      if (activeQuizType === 'post') {
        try {
          localStorage.removeItem(POST_TEST_SESSION_KEY);
        } catch (_) {}
      }

      await loadMyResults();
      setReviewMode(activeQuizType);
      setActiveQuizType(null);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการส่งคำตอบ');
    } finally {
      setSubmitting(false);
    }
  };

  // ส่งแบบทดสอบอัตโนมัติเมื่อหมดเวลา 30 นาที (Auto Submit on Time Up)
  const handleAutoSubmitTimeUp = async () => {
    if (isTimeUpSubmitting) return;
    setIsTimeUpSubmitting(true);
    setShowConfirmModal(false);
    setShowLeaveBlockModal(false);

    try {
      let finalAnswers = userAnswersRef.current || {};
      try {
        const raw = localStorage.getItem(POST_TEST_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.answers) {
            finalAnswers = { ...finalAnswers, ...parsed.answers };
          }
        }
      } catch (_) {}

      await api.post('/quizzes/submit', {
        quizType: 'post',
        answers: finalAnswers
      });

      try {
        localStorage.removeItem(POST_TEST_SESSION_KEY);
      } catch (_) {}

      await loadMyResults();
      setActiveQuizType(null);
      setReviewMode('post');
    } catch (err) {
      console.error('Error auto-submitting post test:', err);
      setActiveQuizType(null);
      setReviewMode('post');
    } finally {
      setIsTimeUpSubmitting(false);
    }
  };

  // จัดรูปแบบเวลา MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
    const isPost = activeQuizType === 'post';
    const isPre = activeQuizType === 'pre';

    // สีและสถานะของเวลานับถอยหลัง (30 นาที)
    const isCriticalTime = isPost && timeLeft <= 300; // เหลือน้อยกว่า 5 นาที
    const isWarningTime = isPost && timeLeft <= 600 && timeLeft > 300; // 5-10 นาที
    const timePercentage = isPost ? (timeLeft / POST_TEST_DURATION) * 100 : 100;

    return (
      // สำหรับ Post-test: ใช้ fixed inset-0 z-50 ครอบเต็มหน้าจอ (Exam Lock Mode) บัง Sidebar มิดชิด ป้องกันการกดออกไปหน้าอื่น
      <div className={isPost ? "fixed inset-0 z-50 bg-slate-100 flex flex-col h-screen overflow-hidden select-none" : "max-w-3xl mx-auto space-y-6"}>
        
        {/* TOP EXAM BAR */}
        <header className={`border-b shadow-sm ${
          isPost 
            ? 'bg-white border-slate-200 px-4 sm:px-8 py-3.5 flex-shrink-0' 
            : 'card !p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-primary/20'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-5xl mx-auto w-full">
            
            {/* รายละเอียดหัวข้อข้อสอบ & Security Badge */}
            <div className="flex items-center gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                    isPre ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isPre ? '📝 แบบทดสอบก่อนเรียน' : '🎓 แบบทดสอบหลังเรียน (Post-test)'}
                  </span>
                  {isPost && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 flex items-center gap-1 border border-rose-200">
                      <Lock size={12}/> ระบบล็อกหน้าจอ (ห้ามออก)
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-black text-gray-800">
                  {isPre ? 'Pre-test: ความรู้พื้นฐานก่อนเรียน' : 'วิชาโปรแกรมนำเสนอ (Microsoft PowerPoint)'}
                </h2>
              </div>
            </div>

            {/* ส่วนตรงกลาง: นาฬิกานับถอยหลัง 30 นาที สำหรับ Post-test */}
            {isPost && (
              <div className="flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl border transition-all"
                style={{
                  backgroundColor: isCriticalTime ? '#FEF2F2' : isWarningTime ? '#FFFBEB' : '#F0FDF4',
                  borderColor: isCriticalTime ? '#FCA5A5' : isWarningTime ? '#FCD34D' : '#86EFAC'
                }}
              >
                <div className="flex items-center gap-2">
                  <Timer size={18} className={`${isCriticalTime ? 'text-rose-600 animate-pulse' : isWarningTime ? 'text-amber-600' : 'text-emerald-600'}`}/>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block leading-tight">เวลาทำข้อสอบที่เหลือ</span>
                    <span className={`text-xl sm:text-2xl font-black tracking-wider ${
                      isCriticalTime ? 'text-rose-600 animate-pulse' : isWarningTime ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
                {/* Mini time remaining bar */}
                <div className="w-28 sm:w-36 bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      isCriticalTime ? 'bg-rose-500' : isWarningTime ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, timePercentage))}%` }}
                  />
                </div>
              </div>
            )}

            {/* ส่วนปุ่มควบคุม: สำหรับ Post-test จะไม่มีปุ่มยกเลิก มีเฉพาะปุ่มส่งคำตอบ */}
            <div className="flex items-center gap-2.5 self-end sm:self-center">
              {isPre && (
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
              )}

              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <FileCheck2 size={16}/> ส่งคำตอบ ({answeredCount}/{totalQuestions})
              </button>
            </div>
          </div>
        </header>

        {/* EXAM CONTENT CONTAINER */}
        <main className={isPost ? "flex-1 overflow-y-auto p-4 sm:p-6" : "space-y-6"}>
          <div className="max-w-3xl mx-auto space-y-5 pb-10">

            {/* Floating Warning for low time in Post-test */}
            {isCriticalTime && (
              <div className="p-3.5 bg-rose-500 text-white rounded-2xl shadow-md flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                  <AlertTriangle size={18} className="flex-shrink-0"/>
                  <span>แจ้งเตือน: เหลือเวลาทำข้อสอบไม่ถึง 5 นาที! ระบบจะทำการส่งคำตอบอัตโนมัติเมื่อครบ 30 นาที</span>
                </div>
                <span className="text-base font-black tracking-wider bg-rose-700/60 px-3 py-1 rounded-xl">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            {/* Progress Bar & Question Tabs */}
            <div className="card !p-5 space-y-3.5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500"/>
                  ความคืบหน้า: ทำแล้ว {answeredCount} จาก {totalQuestions} ข้อ
                </span>
                <span className="font-bold text-primary text-sm">{Math.round((answeredCount / totalQuestions) * 100)}%</span>
              </div>
              
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Quick Question Navigator Buttons */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-400">เลือกข้อที่ต้องการทำ (1 - 10):</span>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> ตอบแล้ว</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"/> ยังไม่ตอบ</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {POWERPOINT_QUIZ_QUESTIONS.map((q, idx) => {
                    const isAnswered = userAnswers[q.id] !== undefined;
                    const isCurrent = idx === currentQIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => handleChangeQuestionIndex(idx)}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all flex items-center justify-center ${
                          isCurrent
                            ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md scale-105'
                            : isAnswered
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="card !p-6 sm:!p-8 space-y-6 shadow-sm border border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200/80">
                    ข้อที่ {currentQIndex + 1} จาก {totalQuestions}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">หัวข้อ: {currentQuestion.topic}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 pt-2 leading-relaxed">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* 4 Choices */}
              <div className="space-y-3 pt-1">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = userAnswers[currentQuestion.id] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                        isSelected
                          ? 'bg-primary/5 border-primary ring-2 ring-primary/30 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                        isSelected ? 'bg-primary text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {CHOICE_LETTERS[optIdx]}
                      </div>
                      <span className={`text-sm sm:text-base flex-1 ${isSelected ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                        {opt}
                      </span>
                      {isSelected && (
                        <CheckCircle2 size={18} className="text-primary flex-shrink-0"/>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleChangeQuestionIndex(Math.max(0, currentQIndex - 1))}
                  disabled={currentQIndex === 0}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-bold transition disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
                >
                  <ChevronLeft size={16}/> ข้อก่อนหน้า
                </button>

                {currentQIndex < totalQuestions - 1 ? (
                  <button
                    onClick={() => handleChangeQuestionIndex(Math.min(totalQuestions - 1, currentQIndex + 1))}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    ข้อถัดไป <ChevronRight size={16}/>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={16}/> ตรวจทานและส่งคำตอบ
                  </button>
                )}
              </div>
            </div>

          </div>
        </main>

        {/* ─── MODAL 1: Confirmation Modal Before Manual Submit ─── */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 font-medium">
                    ⚠️ ยังมีข้อที่ยังไม่ได้ตอบอีก {totalQuestions - answeredCount} ข้อ ต้องการส่งทันทีหรือไม่?
                  </p>
                )}
                {isPost && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    ⏱️ เวลาที่เหลือ: {formatTime(timeLeft)}
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

        {/* ─── MODAL 2: Attempt to Leave Blocked Modal (Anti-Exit) ─── */}
        {showLeaveBlockModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100 animate-scale-up">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldAlert size={28}/>
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-bold text-gray-900 text-lg">⚠️ ไม่อนุญาตให้ออกจากหน้านี้!</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  แบบทดสอบหลังเรียน (Post-test) มีการจำกัดเวลานับถอยหลัง <span className="font-bold text-rose-600">30 นาที</span> และเปิดระบบล็อกหน้าจอเพื่อวัดผลสัมฤทธิ์ทางการเรียนที่แท้จริง
                </p>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-left space-y-1">
                  <span className="font-bold block">ข้อกำหนดระหว่างการสอบ:</span>
                  <p>• คุณไม่สามารถย้อนกลับหรือเปลี่ยนไปหน้าอื่นได้จนกว่าจะส่งคำตอบ</p>
                  <p>• หากหมดเวลา 30 นาที ระบบจะทำการส่งคำตอบอัตโนมัติ</p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setShowLeaveBlockModal(false)}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition"
                >
                  เข้าใจแล้ว กลับไปทำแบบทดสอบต่อ (เหลือเวลา {formatTime(timeLeft)})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL 3: Time Up Submitting Modal (Auto Submit) ─── */}
        {isTimeUpSubmitting && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100 text-center animate-scale-up">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
                <Hourglass size={28}/>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">⏰ หมดเวลา 30 นาทีแล้ว!</h3>
                <p className="text-xs text-gray-500 mt-1">
                  หมดเวลาในการทำแบบทดสอบหลังเรียนแล้ว ระบบกำลังทำการบันทึกและส่งคำตอบของคุณโดยอัตโนมัติ กรุณารอสักครู่...
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"/>
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

        {/* CARD 2: Post-test (หลังเรียน - จับเวลา 30 นาที + ล็อกหน้าจอ) */}
        <div className={`card !p-6 space-y-5 border-2 transition-all flex flex-col justify-between ${
          postRes ? 'border-emerald-200 bg-emerald-50/20 shadow-xs' : 'border-emerald-300 ring-2 ring-emerald-500/20 hover:shadow-md'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                🎓
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Clock size={11}/> 30 นาที
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  postRes ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {postRes ? '✓ ทำแล้ว' : 'ยังไม่ได้ทำ'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5">
                แบบทดสอบหลังเรียน 
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">Post-test</span>
              </h3>
              <p className="text-xs text-gray-500 font-medium">10 ข้อ 4 ตัวเลือก · จำกัดเวลา 30 นาที</p>
            </div>

            {/* Badges ข้อมูลเงื่อนไข 30 นาที & ล็อกหน้าจอ */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                <Timer size={14} className="text-emerald-600 flex-shrink-0"/>
                <span>มีระบบ<strong>นับเวลาถอยหลัง 30 นาที</strong> ทันทีที่เริ่ม</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                <Lock size={14} className="text-rose-600 flex-shrink-0"/>
                <span>ระบบล็อกหน้าจอ <strong>ไม่สามารถกดออกไปหน้าอื่นได้</strong> ระหว่างสอบ</span>
              </div>
            </div>

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
                เริ่มทำแบบทดสอบหลังเรียน (30 นาที) <ArrowRight size={14}/>
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

      {/* ─── MODAL 4: Pre-Exam Start Confirmation Modal (ก่อนเริ่ม Post-test) ─── */}
      {showStartPostModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-100 animate-scale-up">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              🎓
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="font-black text-gray-900 text-lg">เตรียมตัวทำแบบทดสอบหลังเรียน</h3>
              <p className="text-xs text-gray-500">วิชาโปรแกรมนำเสนอ (Microsoft PowerPoint) · 10 ข้อ</p>
            </div>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-gray-700">
              <span className="font-bold text-gray-900 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <AlertCircle size={15} className="text-primary"/> กฎระเบียบและข้อกำหนดการสอบ:
              </span>
              <div className="flex items-start gap-2.5 pt-1">
                <Clock size={16} className="text-emerald-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <strong className="text-gray-900">เวลานับถอยหลัง 30 นาที:</strong> ระบบจะเริ่มนับเวลาทันทีที่กดปุ่มเริ่มทำข้อสอบ
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Lock size={16} className="text-rose-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <strong className="text-gray-900">ระบบล็อกหน้าจอ (Exam Lock):</strong> เมื่อเริ่มสอบแล้ว <strong>จะไม่สามารถกดออกไปหน้าอื่นหรือกดย้อนกลับได้</strong> จนกว่าจะส่งคำตอบ
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Hourglass size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <strong className="text-gray-900">ส่งคำตอบอัตโนมัติ:</strong> หากหมดเวลา 30 นาที ระบบจะทำการส่งคำตอบที่มีอยู่ทันที
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setShowStartPostModal(false)}
                className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-xl text-xs sm:text-sm font-bold transition"
              >
                ยังไม่พร้อม (ยกเลิก)
              </button>
              <button
                onClick={handleConfirmStartPostQuiz}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                เริ่มทำข้อสอบทันที (จับเวลา 30 นาที)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
