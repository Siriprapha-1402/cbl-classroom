import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Send, Edit3, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

export default function ChallengeList() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const load = () => api.get('/challenges')
    .then(r => setChallenges(r.data.challenges || []))
    .catch(console.error)
    .finally(() => setLoading(false));

  useEffect(() => {
    load();
    let bc;
    try {
      bc = new BroadcastChannel('cbl_channel');
      bc.onmessage = () => load();
    } catch (e) {}
    const handleSync = () => load();
    window.addEventListener('storage', handleSync);
    window.addEventListener('cbl_storage_update', handleSync);
    const interval = setInterval(load, 3000);
    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('cbl_storage_update', handleSync);
      clearInterval(interval);
    };
  }, []);

  const showFeedback = (text, type = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handlePublish = async (id) => {
    try {
      await api.post(`/challenges/${id}/publish`);
      try {
        const bc = new BroadcastChannel('cbl_channel');
        bc.postMessage({ type: 'UPDATED', action: 'CHALLENGE_PUBLISHED', id });
        bc.close();
      } catch (e) {}
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('cbl_storage_update'));
      showFeedback('เผยแพร่กิจกรรมเรียบร้อยแล้ว');
      load();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเผยแพร่กิจกรรม');
    }
  };

  const handleDelete = async (id, title) => {
    const confirmText = `⚠️ ยืนยันการลบกิจกรรม?\n\nชื่อกิจกรรม: "${title || 'นี้'}"\n\nเมื่อลบแล้ว ระบบจะลบข้อมูลภารกิจและการส่งงานของนักเรียนที่ผูกกับกิจกรรมนี้ออกทั้งหมด`;
    if (!window.confirm(confirmText)) return;

    setDeletingId(id);
    try {
      await api.delete(`/challenges/${id}`);
      // Optimistic update
      setChallenges(prev => prev.filter(c => c.id !== id));
      
      try {
        const bc = new BroadcastChannel('cbl_channel');
        bc.postMessage({ type: 'UPDATED', action: 'CHALLENGE_DELETED', id });
        bc.close();
      } catch (e) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cbl_storage_update'));
      }
      showFeedback(`ลบกิจกรรม "${title}" เรียบร้อยแล้ว`, 'success');
      await load();
    } catch (err) {
      console.error('Delete challenge error:', err);
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการลบกิจกรรม กรุณาลองใหม่อีกครั้ง');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (c) => {
    if (!window.confirm(`คัดลอกกิจกรรม "${c.title}" เพื่อสร้างเป็นกิจกรรมใหม่ใช่หรือไม่?`)) return;
    try {
      const res = await api.get(`/challenges/${c.id}`);
      const detail = res.data;
      const newPayload = {
        title: `${c.title} (คัดลอกใหม่)`,
        description: detail.challenge?.description || '',
        scenario: detail.challenge?.scenario || '',
        goals: detail.challenge?.goals || '',
        deliverables: detail.challenge?.deliverables || '',
        duration_minutes: detail.challenge?.duration_minutes || 30,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        max_score: detail.challenge?.max_score || 100,
        rubric: detail.challenge?.rubric || '',
        difficulty: detail.challenge?.difficulty || 'medium',
        group_size: detail.challenge?.group_size || 1,
        status: 'active',
        missions: (detail.missions || []).map(m => ({ title: m.title, description: m.description, xp_reward: m.xp_reward })),
        checklistItems: (detail.checklistItems || []).map(cl => typeof cl === 'string' ? cl : cl.item_text)
      };
      await api.post('/challenges', newPayload);
      try {
        const bc = new BroadcastChannel('cbl_channel');
        bc.postMessage({ type: 'UPDATED', action: 'CHALLENGE_CREATED' });
        bc.close();
      } catch (e) {}
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('cbl_storage_update'));
      showFeedback(`คัดลอกและสร้างกิจกรรมใหม่สำเร็จ!`, 'success');
      await load();
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการคัดลอกกิจกรรม');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>📚</span> จัดการกิจกรรม
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            คุณครูสามารถสร้างกิจกรรมใหม่ แก้ไขรายละเอียด หรือลบกิจกรรมที่ไม่ต้องการได้
          </p>
        </div>
        <button 
          onClick={() => navigate('/teacher/challenges/create')} 
          className="btn-primary flex items-center gap-2 text-sm shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={16}/> สร้างกิจกรรมใหม่
        </button>
      </div>

      {/* Feedback Alert */}
      {actionMsg && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
          actionMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600"/> : <AlertCircle size={16} className="text-red-600"/>}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Challenge List */}
      {challenges.length === 0 ? (
        <div className="card text-center py-16 bg-gradient-to-b from-gray-50/50 to-white border-2 border-dashed border-gray-200 rounded-2xl space-y-3">
          <p className="text-5xl mb-2">📋</p>
          <h3 className="font-bold text-gray-800 text-lg">ยังไม่มีกิจกรรมในระบบ</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            คุณครูสามารถกดสร้างกิจกรรมใหม่ เพื่อกำหนดโจทย์ ขั้นตอน และเกณฑ์การประเมินให้นักเรียนได้ทันที
          </p>
          <div className="pt-2">
            <button 
              onClick={() => navigate('/teacher/challenges/create')} 
              className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={16}/> + สร้างกิจกรรมใหม่
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map(c => (
            <div key={c.id} className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base">{c.title}</h3>
                  <span className={`badge text-xs ${c.status === 'active' ? 'bg-green-100 text-green-700 font-semibold' : 'bg-yellow-100 text-yellow-700'}`}>
                    {c.status === 'active' ? '✅ เผยแพร่แล้ว' : '📝 ฉบับร่าง'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  {c.deadline && <span>⏱ กำหนดส่ง: {new Date(c.deadline).toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>}
                  <span>📤 ส่งแล้ว {c.submitted_count || 0} คน</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0 self-end sm:self-center">
                <button 
                  onClick={() => navigate(`/teacher/challenges/edit/${c.id}`)}
                  className="px-2.5 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-medium flex items-center gap-1 transition-colors border border-amber-200/50"
                  title="แก้ไขรายละเอียดกิจกรรม"
                >
                  <Edit3 size={13}/> แก้ไข
                </button>
                <button 
                  onClick={() => navigate('/teacher/submissions')}
                  className="px-2.5 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 font-medium transition-colors"
                >
                  ดูผลงาน
                </button>
                <button 
                  onClick={() => handleDuplicate(c)}
                  className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center gap-1 transition-colors border border-gray-200"
                  title="คัดลอกกิจกรรมนี้เพื่อสร้างเป็นกิจกรรมใหม่"
                >
                  <Copy size={12}/> ทำซ้ำ
                </button>
                {c.status === 'draft' && (
                  <button 
                    onClick={() => handlePublish(c.id)}
                    className="px-2.5 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Send size={13}/> เผยแพร่
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(c.id, c.title)}
                  disabled={deletingId === c.id}
                  className="px-2.5 py-1.5 text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-medium flex items-center gap-1 transition-colors border border-rose-200 disabled:opacity-50"
                  title="ลบกิจกรรมนี้ออกจากระบบ"
                >
                  <Trash2 size={13}/> {deletingId === c.id ? 'กำลังลบ...' : 'ลบ'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
