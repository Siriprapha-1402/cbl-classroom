import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Send, Edit3 } from 'lucide-react';
import api from '../../lib/api';

export default function ChallengeList() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/challenges').then(r => setChallenges(r.data.challenges || [])).catch(console.error).finally(() => setLoading(false));

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

  const handlePublish = async (id) => {
    await api.post(`/challenges/${id}/publish`);
    try {
      const bc = new BroadcastChannel('cbl_channel');
      bc.postMessage({ type: 'UPDATED', action: 'CHALLENGE_PUBLISHED', id });
      bc.close();
    } catch (e) {}
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('cbl_storage_update'));
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ลบกิจกรรมนี้หรือไม่?')) return;
    await api.delete(`/challenges/${id}`).catch(console.error);
    try {
      const bc = new BroadcastChannel('cbl_channel');
      bc.postMessage({ type: 'UPDATED', action: 'CHALLENGE_DELETED', id });
      bc.close();
    } catch (e) {}
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('cbl_storage_update'));
    load();
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">จัดการกิจกรรม</h1>
        <button onClick={() => navigate('/teacher/challenges/create')} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16}/> สร้างกิจกรรมใหม่
        </button>
      </div>

      {challenges.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">📋</p>
          <p className="font-bold text-gray-700 mb-2">ยังไม่มีกิจกรรม</p>
          <button onClick={() => navigate('/teacher/challenges/create')} className="btn-primary text-sm mt-2">+ สร้างกิจกรรมแรก</button>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map(c => (
            <div key={c.id} className="card flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-gray-800">{c.title}</h3>
                  <span className={`badge text-xs ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {c.status === 'active' ? '✅ เผยแพร่แล้ว' : '📝 ฉบับร่าง'}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-gray-400">
                  {c.deadline && <span>⏱ {new Date(c.deadline).toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>}
                  <span>📤 ส่งแล้ว {c.submitted_count || 0} คน</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => navigate(`/teacher/challenges/edit/${c.id}`)}
                  className="px-3 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-medium flex items-center gap-1 transition-colors border border-amber-200/50"
                  title="แก้ไขกิจกรรม">
                  <Edit3 size={13}/> แก้ไข
                </button>
                <button onClick={() => navigate('/teacher/submissions')}
                  className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 font-medium">
                  ดูผลงาน
                </button>
                {c.status === 'draft' && (
                  <button onClick={() => handlePublish(c.id)}
                    className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium flex items-center gap-1">
                    <Send size={13}/> เผยแพร่
                  </button>
                )}
                <button onClick={() => handleDelete(c.id)}
                  className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                  title="ลบกิจกรรม">
                  <Trash2 size={15}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
