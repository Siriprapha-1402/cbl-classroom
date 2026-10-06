import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, 
  Save, Send, CheckCircle2, AlertCircle, Sparkles, HelpCircle 
} from 'lucide-react';
import api from '../../lib/api';

export default function CreateChallenge() {
  const navigate = useNavigate();
  const { id } = useParams(); // ถ้ามี id = แก้ไขกิจกรรมเดิม

  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    scenario: '',
    goals: '',
    deliverables: '',
    deadline: '',
    max_score: 100,
    difficulty: 'medium',
    status: 'active',
  });

  const [missions, setMissions] = useState([
    { title: 'ขั้นที่ 1: วิเคราะห์โจทย์และรวบรวมข้อมูล', description: '' },
    { title: 'ขั้นที่ 2: วางโครงร่างและออกแบบสื่อนำเสนอบน Canva', description: '' },
    { title: 'ขั้นที่ 3: ตรวจสอบความถูกต้องและส่งชิ้นงาน', description: '' },
  ]);

  const [checklist, setChecklist] = useState([
    'เนื้อหาครบถ้วนตามโจทย์และวัตถุประสงค์',
    'จัดรูปแบบ ตัวอักษร และสีสันอย่างสวยงามและอ่านง่าย',
    'ตรวจสอบความถูกต้องก่อนกดส่งงาน',
  ]);

  const [newCheckItem, setNewCheckItem] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // โหลดข้อมูลกิจกรรมเดิม เมื่อเป็นโหมดแก้ไข
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/challenges/${id}`)
      .then(res => {
        const c = res.data.challenge;
        if (c) {
          setForm({
            title: c.title || '',
            description: c.description || '',
            scenario: c.scenario || '',
            goals: c.goals || '',
            deliverables: c.deliverables || '',
            deadline: c.deadline ? c.deadline.substring(0, 16) : '',
            max_score: c.max_score || 100,
            difficulty: c.difficulty || 'medium',
            status: c.status || 'active',
          });
        }
        if (Array.isArray(res.data.missions) && res.data.missions.length > 0) {
          setMissions(res.data.missions.map(m => ({
            id: m.id,
            title: m.title || '',
            description: m.description || '',
          })));
        }
        if (Array.isArray(res.data.checklistItems) && res.data.checklistItems.length > 0) {
          setChecklist(res.data.checklistItems.map(item => 
            typeof item === 'string' ? item : (item.item_text || '')
          ));
        }
      })
      .catch(err => {
        console.error('Failed to load challenge:', err);
        setError('ไม่สามารถโหลดข้อมูลกิจกรรมเดิมได้');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // จัดการ Missions
  const addMission = () => {
    setMissions(m => [...m, { title: `ขั้นที่ ${m.length + 1}: `, description: '' }]);
  };
  const removeMission = i => setMissions(m => m.filter((_, idx) => idx !== i));
  const updateMission = (i, k, v) => setMissions(m => m.map((ms, idx) => idx === i ? { ...ms, [k]: v } : ms));
  const moveMission = (i, dir) => {
    setMissions(prev => {
      const copy = [...prev];
      const target = i + dir;
      if (target < 0 || target >= copy.length) return prev;
      const temp = copy[i];
      copy[i] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  // จัดการ Checklist
  const addCheck = () => {
    if (newCheckItem.trim()) { 
      setChecklist(c => [...c, newCheckItem.trim()]); 
      setNewCheckItem(''); 
    }
  };
  const removeCheck = i => setChecklist(c => c.filter((_, idx) => idx !== i));
  const updateCheck = (i, val) => setChecklist(c => c.map((v, idx) => idx === i ? val : v));

  const parseSafeDeadline = (dl) => {
    if (!dl) return null;
    try {
      const d = new Date(dl);
      return isNaN(d.getTime()) ? null : d.toISOString();
    } catch (e) {
      return null;
    }
  };

  // บันทึกกิจกรรม (Create หรือ Update)
  const handleSave = async (publish = false) => {
    if (!form.title.trim()) { 
      setError('กรุณากรอกชื่อกิจกรรม'); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return; 
    }

    setSaving(true); 
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        scenario: form.scenario.trim(),
        goals: form.goals.trim(),
        deliverables: form.deliverables.trim(),
        status: publish ? 'active' : (form.status || 'active'),
        max_score: Number(form.max_score) || 100,
        deadline: parseSafeDeadline(form.deadline),
        missions: missions
          .filter(m => m.title.trim())
          .map((m, i) => ({ 
            ...m, 
            title: m.title.trim(),
            description: (m.description || '').trim(),
            order_num: i + 1, 
            xp_reward: 10 
          })),
        checklistItems: checklist.filter(item => Boolean(item && item.trim())).map(item => item.trim()),
      };

      let targetId = id;
      if (isEdit) {
        // แก้ไขกิจกรรมเดิม
        await api.put(`/challenges/${id}`, payload);
      } else {
        // สร้างกิจกรรมใหม่
        const res = await api.post('/challenges', payload);
        targetId = res.data.challengeId || res.data.id || res.data.challenge?.id;
      }

      if (publish && targetId) {
        await api.post(`/challenges/${targetId}/publish`).catch(() => {});
      }

      // ส่งสัญญาณซิงค์ไปยังหน้านักเรียนและแท็บอื่นๆ
      try {
        const bc = new BroadcastChannel('cbl_channel');
        bc.postMessage({ 
          type: 'UPDATED', 
          action: isEdit ? 'CHALLENGE_UPDATED' : 'CHALLENGE_CREATED', 
          id: targetId 
        });
        bc.close();
      } catch (e) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cbl_storage_update'));
      }

      setSuccessMsg(isEdit ? 'บันทึกการแก้ไขกิจกรรมเรียบร้อยแล้ว!' : 'สร้างและเผยแพร่กิจกรรมเรียบร้อยแล้ว! กำลังกลับสู่หน้ารายการ...');
      setTimeout(() => {
        navigate('/teacher/challenges');
      }, 700);

    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full p-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all bg-white';
  const lbl = 'block text-sm font-semibold text-gray-700 mb-1.5';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"/>
        <p className="text-gray-400 text-sm font-medium">กำลังโหลดข้อมูลกิจกรรม...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/teacher/challenges')} 
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            title="ย้อนกลับ"
          >
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {isEdit ? '✏️ ปรับแต่งและแก้ไขกิจกรรม' : '✨ สร้างกิจกรรมใหม่'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `กำลังแก้ไขกิจกรรม #${id} — นักเรียนจะเห็นการเปลี่ยนแปลงทันที` : 'กำหนดโจทย์ ขั้นตอน และเกณฑ์การประเมินตามต้องการ'}
            </p>
          </div>
        </div>

        {isEdit && (
          <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
            โหมดแก้ไข
          </span>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={18} className="flex-shrink-0"/>
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 size={18} className="flex-shrink-0"/>
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. ข้อมูลกิจกรรม */}
      <div className="card space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <span className="text-lg">📋</span>
          <h2 className="font-bold text-gray-800">ข้อมูลพื้นฐานของกิจกรรม</h2>
        </div>

        <div>
          <label className={lbl}>ชื่อกิจกรรม <span className="text-red-500">*</span></label>
          <input 
            className={inp} 
            placeholder="เช่น กิจกรรมที่ 1: การออกแบบสื่อนำเสนอแนะนำตนเองและแผนกวิชา" 
            value={form.title} 
            onChange={e => set('title', e.target.value)}
          />
        </div>

        <div>
          <label className={lbl}>คำอธิบาย / โจทย์งานสำหรับนักเรียน</label>
          <textarea 
            className={inp} 
            rows={3} 
            placeholder="อธิบายรายละเอียดสิ่งที่นักเรียนต้องปฏิบัติ เช่น ให้นักเรียนออกแบบสไลด์ด้วย Canva..." 
            value={form.description} 
            onChange={e => set('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>สถานการณ์จำลอง (Scenario)</label>
            <input 
              className={inp} 
              placeholder="เช่น จำลองสถานการณ์การแนะนำตนเองในองค์กร" 
              value={form.scenario} 
              onChange={e => set('scenario', e.target.value)}
            />
          </div>
          <div>
            <label className={lbl}>เป้าหมาย / วัตถุประสงค์ (Goals)</label>
            <input 
              className={inp} 
              placeholder="เช่น สร้างสรรค์สื่อนำเสนอด้วย Canva ได้อย่างถูกต้อง" 
              value={form.goals} 
              onChange={e => set('goals', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={lbl}>วันหมดเขตส่งงาน</label>
            <input 
              type="datetime-local" 
              className={inp} 
              value={form.deadline} 
              onChange={e => set('deadline', e.target.value)}
            />
          </div>
          <div>
            <label className={lbl}>คะแนนเต็ม</label>
            <input 
              type="number" 
              className={inp} 
              min={10} 
              max={100} 
              value={form.max_score} 
              onChange={e => set('max_score', e.target.value)}
            />
          </div>
          <div>
            <label className={lbl}>ระดับความยาก</label>
            <select 
              className={inp} 
              value={form.difficulty} 
              onChange={e => set('difficulty', e.target.value)}
            >
              <option value="easy">ง่าย (Easy)</option>
              <option value="medium">ปานกลาง (Medium)</option>
              <option value="hard">ท้าทาย (Hard)</option>
            </select>
          </div>
        </div>

        <div>
          <label className={lbl}>สถานะการเผยแพร่</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
              <input 
                type="radio" 
                name="status" 
                value="active" 
                checked={form.status === 'active'} 
                onChange={() => set('status', 'active')} 
                className="text-primary focus:ring-primary"
              />
              <span>✅ เผยแพร่ทันที (นักเรียนเห็นและทำได้ทันที)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
              <input 
                type="radio" 
                name="status" 
                value="draft" 
                checked={form.status === 'draft'} 
                onChange={() => set('status', 'draft')} 
                className="text-primary focus:ring-primary"
              />
              <span>📝 ฉบับร่าง</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Missions (ขั้นตอนการทำงาน) */}
      <div className="card space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <h2 className="font-bold text-gray-800">ขั้นตอนการปฏิบัติงาน (Missions)</h2>
              <p className="text-xs text-gray-400">นักเรียนจะทำตามลำดับขั้นตอนทีละขั้น</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={addMission} 
            className="text-xs font-semibold px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg flex items-center gap-1 transition"
          >
            <Plus size={14}/> เพิ่มขั้นตอน
          </button>
        </div>

        {missions.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
            ยังไม่มีขั้นตอน — กดปุ่ม "+ เพิ่มขั้นตอน" เพื่อเพิ่ม
          </div>
        ) : (
          missions.map((m, i) => (
            <div key={i} className="p-3 bg-gray-50/70 border border-gray-200/80 rounded-xl space-y-2 hover:border-primary/40 transition">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs">
                  {i + 1}
                </span>
                <input 
                  className={`${inp} flex-1 font-medium`} 
                  placeholder={`ชื่อขั้นตอนที่ ${i + 1}`} 
                  value={m.title} 
                  onChange={e => updateMission(i, 'title', e.target.value)}
                />
                
                {/* ปุ่มเลื่อนลำดับ */}
                <div className="flex items-center gap-0.5">
                  <button 
                    type="button" 
                    onClick={() => moveMission(i, -1)} 
                    disabled={i === 0} 
                    className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                    title="เลื่อนขึ้น"
                  >
                    <ChevronUp size={16}/>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => moveMission(i, 1)} 
                    disabled={i === missions.length - 1} 
                    className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                    title="เลื่อนลง"
                  >
                    <ChevronDown size={16}/>
                  </button>
                </div>

                <button 
                  type="button" 
                  onClick={() => removeMission(i)} 
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition"
                  title="ลบขั้นตอนนี้"
                >
                  <Trash2 size={16}/>
                </button>
              </div>

              <input 
                className={`${inp} text-xs py-2`} 
                placeholder="คำอธิบายขั้นตอนเพิ่มเติม (ถ้ามี)..." 
                value={m.description || ''} 
                onChange={e => updateMission(i, 'description', e.target.value)}
              />
            </div>
          ))
        )}

        <button 
          type="button" 
          onClick={addMission} 
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-primary hover:text-primary text-sm font-medium transition flex items-center justify-center gap-1.5"
        >
          <Plus size={16}/> เพิ่มขั้นตอนการทำงานใหม่
        </button>
      </div>

      {/* 3. Checklist (รายการตรวจสอบ) */}
      <div className="card space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div>
              <h2 className="font-bold text-gray-800">รายการตรวจสอบก่อนส่งงาน (Checklist)</h2>
              <p className="text-xs text-gray-400">นักเรียนต้องติ๊กยืนยันทุกข้อก่อนส่งลิงก์ Canva</p>
            </div>
          </div>
        </div>

        {checklist.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-emerald-500 font-bold">☑</span>
            <input 
              className={`${inp} flex-1`} 
              value={item} 
              onChange={e => updateCheck(i, e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => removeCheck(i)} 
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition"
              title="ลบรายการนี้"
            >
              <Trash2 size={16}/>
            </button>
          </div>
        ))}

        <div className="flex gap-2 pt-1">
          <input 
            className={`${inp} flex-1`} 
            placeholder="เพิ่มรายการตรวจสอบใหม่..." 
            value={newCheckItem}
            onChange={e => setNewCheckItem(e.target.value)} 
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCheck();
              }
            }}
          />
          <button 
            type="button" 
            onClick={addCheck} 
            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-semibold transition whitespace-nowrap"
          >
            + เพิ่ม
          </button>
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button 
          type="button" 
          onClick={() => navigate('/teacher/challenges')}
          className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 text-sm transition"
        >
          ยกเลิก
        </button>

        <button 
          type="button" 
          onClick={() => handleSave(false)} 
          disabled={saving}
          className="flex-1 py-3 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/5 font-semibold text-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Save size={16}/> {saving ? 'กำลังบันทึก...' : (isEdit ? 'บันทึกการแก้ไข' : 'บันทึกกิจกรรม')}
        </button>

        <button 
          type="button" 
          onClick={() => handleSave(true)} 
          disabled={saving}
          className="flex-1 btn-primary py-3 font-semibold text-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md"
        >
          <Send size={16}/> {saving ? 'กำลังบันทึก...' : (isEdit ? 'บันทึกและเผยแพร่นักเรียนทันที 🚀' : 'สร้างและเผยแพร่นักเรียนทันที 🚀')}
        </button>
      </div>
    </div>
  );
}
