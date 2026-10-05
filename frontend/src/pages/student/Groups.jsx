import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, LogIn, LogOut, Crown, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function StudentGroups() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [joining, setJoining] = useState(null);

  const load = async () => {
    const res = await api.get('/groups').catch(console.error);
    if (res) {
      setGroups(res.data.groups || []);
      setMyGroup(res.data.myGroup || null);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await api.post('/groups', { name: newName.trim() });
    setNewName(''); setShowCreate(false);
    load();
  };

  const handleJoin = async (groupId) => {
    setJoining(groupId);
    await api.post(`/groups/${groupId}/join`).catch(console.error);
    setJoining(null);
    load();
  };

  const handleLeave = async () => {
    if (!myGroup) return;
    if (!window.confirm('ออกจากกลุ่มนี้?')) return;
    await api.post(`/groups/${myGroup.id}/leave`).catch(console.error);
    load();
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"/></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">กลุ่มของฉัน</h1>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><RefreshCw size={16}/></button>
      </div>

      {/* My Group Banner */}
      {myGroup ? (
        <div className="card bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs text-primary font-semibold mb-0.5">กลุ่มของฉัน ✅</p>
              <h2 className="font-bold text-xl text-gray-800">{myGroup.name}</h2>
            </div>
            <button onClick={handleLeave} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">
              <LogOut size={13}/> ออกจากกลุ่ม
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(myGroup.members || []).map(m => (
              <div key={m.id} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 shadow-sm text-sm">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                  {m.name?.charAt(0)}
                </span>
                <span className="text-gray-700">{m.name}</span>
                {myGroup.leader_id === m.id && <Crown size={11} className="text-accent"/>}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{(myGroup.members||[]).length} คนในกลุ่ม</p>
        </div>
      ) : (
        <div className="card bg-yellow-50 border border-yellow-200 text-center py-5">
          <p className="text-yellow-700 font-medium text-sm">⚠️ คุณยังไม่มีกลุ่ม</p>
          <p className="text-yellow-600 text-xs mt-1">สร้างกลุ่มใหม่หรือเข้าร่วมกลุ่มที่มีอยู่</p>
        </div>
      )}

      {/* Create Group */}
      {!showCreate ? (
        <button onClick={() => setShowCreate(true)}
          className="w-full py-3 border-2 border-dashed border-primary/40 text-primary rounded-2xl text-sm font-semibold hover:bg-primary/5 flex items-center justify-center gap-2">
          <Plus size={16}/> สร้างกลุ่มใหม่
        </button>
      ) : (
        <div className="card border-2 border-primary space-y-3">
          <h3 className="font-bold text-gray-800">ตั้งชื่อกลุ่ม</h3>
          <input className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none text-sm"
            placeholder="เช่น ทีม Alpha" value={newName}
            onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus/>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary flex-1 py-2 text-sm">✅ สร้างกลุ่ม</button>
            <button onClick={() => { setShowCreate(false); setNewName(''); }} className="flex-1 py-2 border rounded-xl text-gray-500 text-sm">ยกเลิก</button>
          </div>
        </div>
      )}

      {/* All Groups */}
      <div>
        <h2 className="font-semibold text-gray-600 mb-3 text-sm">กลุ่มทั้งหมด ({groups.length} กลุ่ม)</h2>
        {groups.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <Users size={36} className="mx-auto mb-2 opacity-30"/>
            <p className="text-sm">ยังไม่มีกลุ่ม — รอครูสร้างหรือสร้างเองได้เลย</p>
          </div>
        ) : groups.map(g => {
          const isMyGroup = myGroup?.id === g.id;
          return (
            <div key={g.id} className={`card mb-3 ${isMyGroup ? 'border-2 border-primary/40' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Users size={15} className="text-primary"/>{g.name}
                    {isMyGroup && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">กลุ่มฉัน</span>}
                  </h3>
                  <p className="text-xs text-gray-400">{(g.members||[]).length} คน</p>
                </div>
                {!isMyGroup && (
                  <button onClick={() => handleJoin(g.id)} disabled={joining === g.id}
                    className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 font-semibold disabled:opacity-50">
                    <LogIn size={13}/> {joining === g.id ? '...' : 'เข้าร่วม'}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(g.members || []).map(m => (
                  <span key={m.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1">
                    {m.name} {g.leader_id === m.id && <Crown size={10} className="text-accent"/>}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
