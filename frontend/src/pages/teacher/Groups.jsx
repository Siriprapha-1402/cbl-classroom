import React, { useEffect, useState } from 'react';
import { Users, Shuffle, Plus, LogOut, Crown, UserPlus, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

export default function TeacherGroups() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [numGroups, setNumGroups] = useState(8);
  const [randomizing, setRandomizing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const load = async () => {
    const [gRes, sRes] = await Promise.all([api.get('/groups'), api.get('/students')]);
    setGroups(gRes.data.groups || []);
    setStudents(sRes.data.students || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRandom = async () => {
    if (!window.confirm(`สุ่มแบ่งนักเรียน ${students.length} คน เป็น ${numGroups} กลุ่ม?\n(กลุ่มเดิมทั้งหมดจะถูกลบ)`)) return;
    setRandomizing(true);
    await api.post('/groups/random', { numGroups }).catch(console.error);
    await load();
    setRandomizing(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await api.post('/groups', { name: newName.trim(), memberIds: [] });
    setNewName(''); setShowCreate(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ลบกลุ่มนี้?')) return;
    await api.delete(`/groups/${id}`);
    load();
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">จัดการกลุ่ม</h1>
          <p className="text-sm text-gray-400">{students.length} คน · {groups.length} กลุ่ม</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary rounded-xl text-sm font-semibold hover:bg-primary/5">
            <Plus size={16}/> สร้างกลุ่มใหม่
          </button>
          <button onClick={handleRandom} disabled={randomizing}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
            <Shuffle size={16}/> {randomizing ? 'กำลังสุ่ม...' : 'สุ่มจัดกลุ่ม'}
          </button>
        </div>
      </div>

      {/* Config */}
      <div className="card !p-4 bg-blue-50 border border-blue-200 flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-blue-700">จำนวนกลุ่ม:</span>
        <input type="number" min={2} max={20} value={numGroups}
          onChange={e => setNumGroups(Number(e.target.value))}
          className="w-20 p-2 rounded-xl border border-blue-300 text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary"/>
        <span className="text-sm text-blue-500">
          กลุ่ม (~{Math.ceil(students.length / numGroups)} คน/กลุ่ม)
        </span>
      </div>

      {/* Create Group */}
      {showCreate && (
        <div className="card border-2 border-primary space-y-3">
          <h3 className="font-bold text-gray-800">สร้างกลุ่มใหม่</h3>
          <input className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none text-sm"
            placeholder="ชื่อกลุ่ม เช่น กลุ่ม Alpha" value={newName}
            onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus/>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary flex-1 py-2 text-sm">สร้าง</button>
            <button onClick={() => { setShowCreate(false); setNewName(''); }} className="flex-1 py-2 border rounded-xl text-gray-500 text-sm">ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="card text-center py-14 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium">ยังไม่มีกลุ่ม</p>
          <p className="text-sm mt-1">กด "สุ่มจัดกลุ่ม" หรือ "สร้างกลุ่มใหม่"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groups.map(g => (
            <div key={g.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Users size={16} className="text-primary"/>{g.name}
                </h3>
                <button onClick={() => handleDelete(g.id)} className="text-gray-300 hover:text-danger p-1 rounded">
                  ✕
                </button>
              </div>
              <ul className="space-y-1.5">
                {(g.members || []).map(m => (
                  <li key={m.id} className="flex items-center gap-2 text-sm p-1.5 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {m.name?.charAt(0) || '?'}
                    </div>
                    <span className="truncate text-gray-700 flex-1">{m.name}</span>
                    {g.leader_id === m.id && <Crown size={12} className="text-accent flex-shrink-0"/>}
                  </li>
                ))}
                {(g.members || []).length === 0 && <li className="text-xs text-gray-400 text-center py-1">ยังไม่มีสมาชิก</li>}
              </ul>
              <p className="text-xs text-gray-400 mt-2 text-right">{(g.members || []).length} คน</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
