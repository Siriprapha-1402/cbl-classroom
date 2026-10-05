import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';

export default function CreateChallenge() {
  const navigate = useNavigate();
  const { id } = useParams(); // ถ้ามี id = แก้ไข

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    max_score: 100,
    difficulty: 'medium',
  });

  const [missions, setMissions] = useState([
    { title: 'ขั้นที่ 1: วิเคราะห์โจทย์', description: '' },
    { title: 'ขั้นที่ 2: วางแผนการทำงาน', description: '' },
    { title: 'ขั้นที่ 3: ลงมือทำ', description: '' },
  ]);

  const [checklist, setChecklist] = useState([
    'เนื้อหาครบถ้วนตามโจทย์',
    'จัดรูปแบบสวยงามเรียบร้อย',
    'ตรวจสอบความถูกต้องก่อนส่ง',
  ]);

  const [newCheckItem, setNewCheckItem] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addMission = () => setMissions(m => [...m, { title: '', description: '' }]);
  const removeMission = i => setMissions(m => m.filter((_, idx) => idx !== i));
  const updateMission = (i, k, v) => setMissions(m => m.map((ms, idx) => idx === i ? { ...ms, [k]: v } : ms));

  const addCheck = () => {
    if (newCheckItem.trim()) { setChecklist(c => [...c, newCheckItem.trim()]); setNewCheckItem(''); }
  };
  const removeCheck = i => setChecklist(c => c.filter((_, idx) => idx !== i));

  const handleSave = async (publish = false) => {
    if (!form.title.trim()) { setError('กรุณากรอกชื่อกิจกรรม'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        max_score: Number(form.max_score) || 100,
        deadline: form.deadline || null,
        missions: missions.filter(m => m.title.trim()).map((m, i) => ({ ...m, order_num: i + 1, xp_reward: 10 })),
        checklistItems: checklist.filter(Boolean),
      };
      const res = await api.post('/challenges', payload);
      const newId = res.data.challengeId;
      if (publish) await api.post(`/challenges/${newId}/publish`);
      navigate('/teacher/challenges');
    } catch (e) {
      setError(e.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full p-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all';
  const lbl = 'block text-sm font-semibold text-gray-600 mb-1.5';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/teacher/challenges')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
          <ArrowLeft size={20}/>
        </button>
        <h1 className="text-xl font-bold text-gray-800">{id ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}</h1>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-500 rounded-xl text-sm text-center">{error}</div>}

      {/* ข้อมูลพื้นฐาน */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gray-700">📋 ข้อมูลกิจกรรม</h2>
        <div>
          <label className={lbl}>ชื่อกิจกรรม <span className="text-red-400">*</span></label>
          <input className={inp} placeholder="เช่น สร้าง Presentation นำเสนอสินค้า" value={form.title} onChange={e => set('title', e.target.value)}/>
        </div>
        <div>
          <label className={lbl}>คำอธิบาย / โจทย์</label>
          <textarea className={inp} rows={4} placeholder="อธิบายสิ่งที่นักเรียนต้องทำ..." value={form.description} onChange={e => set('description', e.target.value)}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>วันหมดเขตส่งงาน</label>
            <input type="datetime-local" className={inp} value={form.deadline} onChange={e => set('deadline', e.target.value)}/>
          </div>
          <div>
            <label className={lbl}>คะแนนเต็ม</label>
            <input type="number" className={inp} min={10} max={100} value={form.max_score} onChange={e => set('max_score', e.target.value)}/>
          </div>
        </div>
      </div>

      {/* Missions */}
      <div className="card space-y-3">
        <h2 className="font-bold text-gray-700">🎯 ขั้นตอนการทำงาน (Missions)</h2>
        <p className="text-xs text-gray-400">นักเรียนต้องทำตามลำดับ — กดเสร็จทีละข้อ</p>
        {missions.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
            <input className={`${inp} flex-1`} placeholder={`ขั้นที่ ${i + 1}`} value={m.title} onChange={e => updateMission(i, 'title', e.target.value)}/>
            <button onClick={() => removeMission(i)} className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg"><Trash2 size={15}/></button>
          </div>
        ))}
        <button onClick={addMission} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-primary hover:text-primary text-sm transition-colors">
          <Plus size={15} className="inline mr-1"/> เพิ่มขั้นตอน
        </button>
      </div>

      {/* Checklist */}
      <div className="card space-y-3">
        <h2 className="font-bold text-gray-700">✅ รายการตรวจสอบก่อนส่ง (Checklist)</h2>
        <p className="text-xs text-gray-400">นักเรียนต้องเช็คทุกรายการก่อนอัปโหลดไฟล์</p>
        {checklist.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-green-500">☑</span>
            <input className={`${inp} flex-1`} value={item} onChange={e => setChecklist(c => c.map((v, idx) => idx === i ? e.target.value : v))}/>
            <button onClick={() => removeCheck(i)} className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg"><Trash2 size={15}/></button>
          </div>
        ))}
        <div className="flex gap-2">
          <input className={`${inp} flex-1`} placeholder="เพิ่มรายการตรวจสอบ..." value={newCheckItem}
            onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCheck()}/>
          <button onClick={addCheck} className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 text-sm font-semibold">+ เพิ่ม</button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => handleSave(false)} disabled={saving}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50 text-sm">
          {saving ? 'กำลังบันทึก...' : '💾 บันทึกฉบับร่าง'}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="flex-1 btn-primary py-3 disabled:opacity-50 text-sm">
          {saving ? 'กำลังบันทึก...' : '🚀 บันทึกและเผยแพร่'}
        </button>
      </div>
    </div>
  );
}
