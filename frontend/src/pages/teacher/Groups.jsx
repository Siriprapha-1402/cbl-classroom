import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, Shuffle, Plus, Crown, UserPlus, Trash2, Edit3, X, 
  Check, Search, AlertCircle, RefreshCw, Sparkles, UserMinus, ChevronDown, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

export default function TeacherGroups() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Random grouping state
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [numGroups, setNumGroups] = useState(8);
  const [randomizing, setRandomizing] = useState(false);

  // Create Group Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createMemberIds, setCreateMemberIds] = useState([]);
  const [createLeaderId, setCreateLeaderId] = useState(null);
  const [createSearch, setCreateSearch] = useState('');
  const [createFilter, setCreateFilter] = useState('unassigned'); // 'all' | 'unassigned'
  const [savingCreate, setSavingCreate] = useState(false);

  // Edit Group Modal state
  const [editingGroup, setEditingGroup] = useState(null); // { id, name, leaderId, memberIds: [] }
  const [editSearch, setEditSearch] = useState('');
  const [editFilter, setEditFilter] = useState('all'); // 'all' | 'in_group' | 'unassigned'
  const [savingEdit, setSavingEdit] = useState(false);

  // Quick Add Member Modal / Popover state
  const [quickAddGroup, setQuickAddGroup] = useState(null);
  const [quickAddSearch, setQuickAddSearch] = useState('');

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const [gRes, sRes] = await Promise.all([
        api.get('/groups'),
        api.get('/students')
      ]);
      setGroups(gRes.data.groups || []);
      setStudents(sRes.data.students || []);
    } catch (err) {
      console.error('Failed to load groups data:', err);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();

    let bc;
    try {
      bc = new BroadcastChannel('cbl_channel');
      bc.onmessage = () => load(true);
    } catch (e) {}

    const handleSync = (e) => {
      if (!e?.key || e.key === 'cbl_mock_db_clean_v6') load(true);
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('cbl_storage_update', handleSync);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('cbl_storage_update', handleSync);
    };
  }, []);

  // Compute student assignments
  const { assignedMap, assignedCount, unassignedStudents } = useMemo(() => {
    const map = {}; // studentId -> group
    let count = 0;
    (groups || []).forEach(g => {
      (g.members || []).forEach(m => {
        map[m.id] = g;
        count++;
      });
    });
    const unassigned = (students || []).filter(s => !map[s.id]);
    return { assignedMap: map, assignedCount: count, unassignedStudents: unassigned };
  }, [groups, students]);

  // Handle Random Grouping
  const handleRandom = async () => {
    if (!window.confirm(`สุ่มจัดกลุ่มนักเรียนทั้งหมด ${students.length} คน ออกเป็น ${numGroups} กลุ่ม?\n(กลุ่มเดิมจะถูกแทนที่ด้วยกลุ่มใหม่)`)) return;
    setRandomizing(true);
    try {
      await api.post('/groups/random', { numGroups });
      await load(true);
      setShowRandomModal(false);
      showToast(`สุ่มจัดกลุ่มสำเร็จ (${numGroups} กลุ่ม)`);
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถสุ่มจัดกลุ่มได้', 'error');
    } finally {
      setRandomizing(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    const defaultName = `กลุ่ม ${String(groups.length + 1).padStart(2, '0')}`;
    setCreateName(defaultName);
    setCreateMemberIds([]);
    setCreateLeaderId(null);
    setCreateSearch('');
    setCreateFilter('unassigned');
    setShowCreateModal(true);
  };

  // Save Create Group
  const handleSaveCreate = async () => {
    if (!createName.trim()) {
      alert('กรุณากรอกชื่อกลุ่ม');
      return;
    }
    setSavingCreate(true);
    try {
      await api.post('/groups', {
        name: createName.trim(),
        memberIds: createMemberIds,
        leaderId: createLeaderId
      });
      await load(true);
      setShowCreateModal(false);
      showToast(`สร้างกลุ่ม "${createName.trim()}" สำเร็จ`);
    } catch (err) {
      console.error(err);
      showToast('สร้างกลุ่มไม่สำเร็จ', 'error');
    } finally {
      setSavingCreate(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (group) => {
    setEditingGroup({
      id: group.id,
      name: group.name,
      leaderId: group.leader_id || (group.members?.[0]?.id || null),
      memberIds: (group.members || []).map(m => m.id)
    });
    setEditSearch('');
    setEditFilter('all');
  };

  // Save Edit Group
  const handleSaveEdit = async () => {
    if (!editingGroup || !editingGroup.name.trim()) {
      alert('กรุณาระบุชื่อกลุ่ม');
      return;
    }
    setSavingEdit(true);
    try {
      await api.put(`/groups/${editingGroup.id}`, {
        name: editingGroup.name.trim(),
        leaderId: editingGroup.leaderId,
        memberIds: editingGroup.memberIds
      });
      await load(true);
      showToast(`บันทึกการแก้ไขกลุ่ม "${editingGroup.name}" สำเร็จ`);
      setEditingGroup(null);
    } catch (err) {
      console.error(err);
      showToast('บันทึกการแก้ไขไม่สำเร็จ', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Single Group
  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่ม "${group.name}"?\n(สมาชิก ${(group.members || []).length} คนจะกลับไปเป็นสถานะยังไม่มีกลุ่ม)`)) return;
    try {
      await api.delete(`/groups/${group.id}`);
      await load(true);
      showToast(`ลบกลุ่ม "${group.name}" แล้ว`);
    } catch (err) {
      console.error(err);
      showToast('ลบกลุ่มไม่สำเร็จ', 'error');
    }
  };

  // Clear All Groups
  const handleClearAllGroups = async () => {
    if (groups.length === 0) return;
    if (!window.confirm(`ลบกลุ่มทั้งหมด ${groups.length} กลุ่ม?\nนักเรียนทุกคนจะกลับไปเป็นสถานะ "ยังไม่มีกลุ่ม"`)) return;
    try {
      await api.delete('/groups');
      await load(true);
      showToast('ลบกลุ่มทั้งหมดเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถลบกลุ่มทั้งหมดได้', 'error');
    }
  };

  // Remove single member from group card
  const handleRemoveMember = async (groupId, studentId, studentName) => {
    if (!window.confirm(`นำ "${studentName}" ออกจากกลุ่ม?`)) return;
    try {
      await api.delete(`/groups/${groupId}/members/${studentId}`);
      await load(true);
      showToast(`นำ "${studentName}" ออกจากกลุ่มแล้ว`);
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถนำสมาชิกออกได้', 'error');
    }
  };

  // Set Leader from group card
  const handleSetLeader = async (groupId, studentId, studentName) => {
    try {
      await api.put(`/groups/${groupId}`, { leaderId: studentId });
      await load(true);
      showToast(`ตั้ง "${studentName}" เป็นหัวหน้ากลุ่มแล้ว`);
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถตั้งหัวหน้ากลุ่มได้', 'error');
    }
  };

  // Quick Add Member to Group
  const handleQuickAdd = async (groupId, studentId) => {
    try {
      await api.post(`/groups/${groupId}/members`, { studentId });
      await load(true);
      setQuickAddGroup(null);
      showToast('เพิ่มนักเรียนเข้ากลุ่มเรียบร้อย');
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถเพิ่มเข้ากลุ่มได้', 'error');
    }
  };

  // Auto-group unassigned students into a new group
  const handleGroupUnassigned = async () => {
    if (unassignedStudents.length === 0) return;
    const defaultName = `กลุ่ม ${String(groups.length + 1).padStart(2, '0')}`;
    const name = window.prompt(`สร้างกลุ่มใหม่สำหรับนักเรียนที่ยังไม่มีกลุ่ม (${unassignedStudents.length} คน):`, defaultName);
    if (!name || !name.trim()) return;
    try {
      await api.post('/groups', {
        name: name.trim(),
        memberIds: unassignedStudents.map(s => s.id),
        leaderId: unassignedStudents[0]?.id || null
      });
      await load(true);
      showToast(`จัดกลุ่มให้นักเรียน ${unassignedStudents.length} คน สำเร็จ`);
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถสร้างกลุ่มได้', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-80 space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-sm"/>
        <p className="text-gray-500 font-medium text-sm">กำลังโหลดข้อมูลกลุ่มและนักเรียน...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all animate-bounce ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">จัดการกลุ่มเรียน</h1>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
              ห้อง ปวช.1/1
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ครูสามารถจับกลุ่มด้วยตนเอง, สุ่มจัดกลุ่ม, แก้ไขสมาชิก/หัวหน้ากลุ่ม, และลบกลุ่มได้อิสระ
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => load(true)} 
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''}/>
          </button>

          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm shadow hover:bg-primary-dark transition-all hover:shadow-md active:scale-95"
          >
            <Plus size={18}/> สร้างกลุ่มใหม่
          </button>

          <button 
            onClick={() => setShowRandomModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-xl text-sm hover:bg-indigo-100 transition-all active:scale-95"
          >
            <Shuffle size={16}/> สุ่มจัดกลุ่ม
          </button>

          {groups.length > 0 && (
            <button 
              onClick={handleClearAllGroups}
              className="flex items-center gap-2 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium border border-transparent hover:border-red-200 transition-all"
            >
              <Trash2 size={16}/> ล้างทุกกลุ่ม
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={22}/>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">นักเรียนทั้งหมด</p>
            <p className="text-xl font-black text-gray-800">{students.length} <span className="text-xs font-normal text-gray-400">คน</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={22}/>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">มีกลุ่มแล้ว</p>
            <p className="text-xl font-black text-emerald-600">{assignedCount} <span className="text-xs font-normal text-gray-400">คน</span></p>
          </div>
        </div>

        <div className={`bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3 ${
          unassignedStudents.length > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
            unassignedStudents.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <AlertCircle size={22}/>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">ยังไม่มีกลุ่ม</p>
            <p className={`text-xl font-black ${unassignedStudents.length > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
              {unassignedStudents.length} <span className="text-xs font-normal text-gray-400">คน</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles size={22}/>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">จำนวนกลุ่มปัจจุบัน</p>
            <p className="text-xl font-black text-purple-600">{groups.length} <span className="text-xs font-normal text-gray-400">กลุ่ม</span></p>
          </div>
        </div>
      </div>

      {/* Unassigned Students Tray (if any) */}
      {unassignedStudents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="font-bold text-amber-900 text-base">
                นักเรียนที่ยังไม่ได้จัดกลุ่ม ({unassignedStudents.length} คน)
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={handleGroupUnassigned}
                className="text-xs bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-xl hover:bg-amber-700 transition shadow-sm"
              >
                + สร้างกลุ่มใหม่จากนักเรียนเหล่านี้ ({unassignedStudents.length} คน)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {unassignedStudents.map(s => (
              <div 
                key={s.id} 
                className="bg-white border border-amber-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs"
              >
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                  {s.name?.charAt(0) || '?'}
                </div>
                <div className="text-xs">
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="text-gray-400 ml-1.5">({s.student_code || s.username})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 text-center py-16 px-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Users size={32}/>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">ยังไม่มีกลุ่มในระบบ</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto mt-1">
              กดปุ่ม "สร้างกลุ่มใหม่" เพื่อกำหนดสมาชิกเอง หรือกด "สุ่มจัดกลุ่ม" เพื่อแบ่งกลุ่มให้อัตโนมัติทันที
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button 
              onClick={openCreateModal}
              className="btn-primary text-sm flex items-center gap-2 px-5 py-2.5 rounded-xl"
            >
              <Plus size={16}/> สร้างกลุ่มแรก
            </button>
            <button 
              onClick={() => setShowRandomModal(true)}
              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-semibold flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-200"
            >
              <Shuffle size={16}/> สุ่มจัดกลุ่ม {students.length} คน
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {groups.map(g => {
            const memberList = g.members || [];
            const leaderMember = memberList.find(m => m.id === g.leader_id);

            return (
              <div 
                key={g.id} 
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Group Card Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Users size={18}/>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-base leading-tight">{g.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        สมาชิก {memberList.length} คน
                        {leaderMember && <span className="ml-1 text-accent font-medium">· 👑 {leaderMember.name}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Group Header Actions */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal(g)}
                      className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                      title="แก้ไขกลุ่มและสมาชิก"
                    >
                      <Edit3 size={16}/>
                    </button>
                    <button 
                      onClick={() => setQuickAddGroup(g)}
                      className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="เพิ่มสมาชิกเข้ากลุ่มนี้"
                    >
                      <UserPlus size={16}/>
                    </button>
                    <button 
                      onClick={() => handleDeleteGroup(g)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="ลบกลุ่มนี้"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>

                {/* Group Members List */}
                <div className="p-4 flex-1">
                  {memberList.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 space-y-1">
                      <Users size={28} className="mx-auto opacity-30"/>
                      <p className="text-xs">ยังไม่มีสมาชิกในกลุ่มนี้</p>
                      <button 
                        onClick={() => openEditModal(g)}
                        className="text-xs text-primary font-semibold hover:underline inline-block pt-1"
                      >
                        + เพิ่มสมาชิกเลย
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {memberList.map(m => {
                        const isLeader = g.leader_id === m.id;
                        return (
                          <li 
                            key={m.id} 
                            className={`flex items-center justify-between p-2 rounded-xl text-xs transition ${
                              isLeader ? 'bg-amber-50/80 border border-amber-200' : 'bg-gray-50 hover:bg-gray-100/80 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                isLeader ? 'bg-amber-400 text-white' : 'bg-primary/20 text-primary'
                              }`}>
                                {m.name?.charAt(0) || '?'}
                              </div>
                              <div className="min-w-0 flex-1 truncate">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-semibold text-gray-800 truncate">{m.name}</span>
                                  {isLeader && (
                                    <span className="px-1.5 py-0.2 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-md flex items-center gap-0.5">
                                      <Crown size={9}/> หัวหน้า
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-400 block truncate">
                                  {m.student_code || m.username}
                                </span>
                              </div>
                            </div>

                            {/* Member Item Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!isLeader && (
                                <button 
                                  onClick={() => handleSetLeader(g.id, m.id, m.name)}
                                  className="p-1 text-gray-400 hover:text-amber-500 hover:bg-amber-100 rounded-md transition"
                                  title="ตั้งเป็นหัวหน้ากลุ่ม"
                                >
                                  <Crown size={13}/>
                                </button>
                              )}
                              <button 
                                onClick={() => handleRemoveMember(g.id, m.id, m.name)}
                                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                                title="นำออกจากกลุ่ม"
                              >
                                <X size={13}/>
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>ความจุ ~5-6 คน</span>
                  <button 
                    onClick={() => openEditModal(g)}
                    className="text-primary font-semibold hover:underline"
                  >
                    จัดการกลุ่ม →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. Modal: สร้างกลุ่มใหม่ (Create Group Modal) */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                  <Plus size={20}/>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">สร้างกลุ่มใหม่</h3>
                  <p className="text-xs text-gray-400">กำหนดชื่อกลุ่มและเลือกนักเรียนเข้ากลุ่ม</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200 transition"
              >
                <X size={18}/>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Group Name Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  ชื่อกลุ่ม <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="เช่น กลุ่ม 01, ทีมนวัตกรรม ฯลฯ"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium"
                />
              </div>

              {/* Member Picker Header */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    เลือกสมาชิก ({createMemberIds.length} คน)
                  </label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        const unassignedIds = unassignedStudents.map(s => s.id);
                        setCreateMemberIds(Array.from(new Set([...createMemberIds, ...unassignedIds])));
                        if (!createLeaderId && unassignedIds.length > 0) setCreateLeaderId(unassignedIds[0]);
                      }}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      เลือกนักเรียนที่ยังไม่มีกลุ่มทั้งหมด
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      type="button"
                      onClick={() => { setCreateMemberIds([]); setCreateLeaderId(null); }}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      ล้างการเลือก
                    </button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-3 text-gray-400"/>
                    <input 
                      type="text"
                      value={createSearch}
                      onChange={e => setCreateSearch(e.target.value)}
                      placeholder="ค้นหาชื่อ หรือ รหัสนักเรียน..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex rounded-xl border border-gray-200 p-0.5 bg-gray-50 text-xs">
                    <button 
                      type="button"
                      onClick={() => setCreateFilter('unassigned')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        createFilter === 'unassigned' ? 'bg-white shadow-xs text-primary font-bold' : 'text-gray-500'
                      }`}
                    >
                      ยังไม่มีกลุ่ม ({unassignedStudents.length})
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCreateFilter('all')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        createFilter === 'all' ? 'bg-white shadow-xs text-primary font-bold' : 'text-gray-500'
                      }`}
                    >
                      ทั้งหมด ({students.length})
                    </button>
                  </div>
                </div>

                {/* Students Checklist */}
                <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                  {students
                    .filter(s => {
                      if (createFilter === 'unassigned' && assignedMap[s.id]) return false;
                      if (!createSearch.trim()) return true;
                      const q = createSearch.toLowerCase();
                      return s.name.toLowerCase().includes(q) || (s.student_code || s.username || '').includes(q);
                    })
                    .map(s => {
                      const isSelected = createMemberIds.includes(s.id);
                      const currentGroup = assignedMap[s.id];
                      const isLeader = createLeaderId === s.id;

                      return (
                        <div 
                          key={s.id}
                          onClick={() => {
                            if (isSelected) {
                              setCreateMemberIds(createMemberIds.filter(id => id !== s.id));
                              if (createLeaderId === s.id) setCreateLeaderId(null);
                            } else {
                              const newIds = [...createMemberIds, s.id];
                              setCreateMemberIds(newIds);
                              if (!createLeaderId) setCreateLeaderId(s.id);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 px-3 cursor-pointer text-xs transition ${
                            isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {}} // handled by parent div
                              className="rounded text-primary focus:ring-primary w-4 h-4"
                            />
                            <div>
                              <span className="font-semibold text-gray-800">{s.name}</span>
                              <span className="text-gray-400 ml-1.5 font-mono">({s.student_code || s.username})</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {currentGroup && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                อยู่ใน: {currentGroup.name} (จะถูกย้าย)
                              </span>
                            )}
                            {!currentGroup && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                ยังไม่มีกลุ่ม
                              </span>
                            )}
                            {isSelected && (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCreateLeaderId(s.id);
                                }}
                                className={`p-1 rounded-md transition ${
                                  isLeader ? 'bg-amber-400 text-white' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
                                }`}
                                title={isLeader ? 'เป็นหัวหน้ากลุ่มแล้ว' : 'ตั้งเป็นหัวหน้ากลุ่ม'}
                              >
                                <Crown size={14}/>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-100"
              >
                ยกเลิก
              </button>
              <button 
                type="button"
                onClick={handleSaveCreate}
                disabled={savingCreate}
                className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-60"
              >
                {savingCreate ? 'กำลังบันทึก...' : '✅ ยืนยันสร้างกลุ่ม'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. Modal: แก้ไขกลุ่ม (Edit Group Modal) */}
      {/* ========================================================= */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                  <Edit3 size={18}/>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">แก้ไขกลุ่ม</h3>
                  <p className="text-xs text-gray-400">เปลี่ยนชื่อกลุ่ม, จัดการสมาชิก, และเลือกหัวหน้ากลุ่ม</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingGroup(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200 transition"
              >
                <X size={18}/>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Group Name Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  ชื่อกลุ่ม <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={editingGroup.name}
                  onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  placeholder="ชื่อกลุ่ม"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium"
                />
              </div>

              {/* Members Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    สมาชิกในกลุ่ม ({editingGroup.memberIds.length} คน)
                  </label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        const unassignedIds = unassignedStudents.map(s => s.id);
                        setEditingGroup({
                          ...editingGroup,
                          memberIds: Array.from(new Set([...editingGroup.memberIds, ...unassignedIds]))
                        });
                      }}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      + ดึงนักเรียนที่ยังไม่มีกลุ่มมาใส่ทั้งหมด
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      type="button"
                      onClick={() => setEditingGroup({ ...editingGroup, memberIds: [], leaderId: null })}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      ล้างสมาชิกทั้งหมด
                    </button>
                  </div>
                </div>

                {/* Filter and Search */}
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-3 text-gray-400"/>
                    <input 
                      type="text"
                      value={editSearch}
                      onChange={e => setEditSearch(e.target.value)}
                      placeholder="ค้นหาชื่อ หรือ รหัสนักเรียน..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex rounded-xl border border-gray-200 p-0.5 bg-gray-50 text-xs">
                    <button 
                      type="button"
                      onClick={() => setEditFilter('all')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        editFilter === 'all' ? 'bg-white shadow-xs text-primary font-bold' : 'text-gray-500'
                      }`}
                    >
                      ทั้งหมด ({students.length})
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditFilter('in_group')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        editFilter === 'in_group' ? 'bg-white shadow-xs text-primary font-bold' : 'text-gray-500'
                      }`}
                    >
                      ในกลุ่มนี้ ({editingGroup.memberIds.length})
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditFilter('unassigned')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        editFilter === 'unassigned' ? 'bg-white shadow-xs text-primary font-bold' : 'text-gray-500'
                      }`}
                    >
                      ยังไม่มีกลุ่ม ({unassignedStudents.length})
                    </button>
                  </div>
                </div>

                {/* Checklist */}
                <div className="border border-gray-200 rounded-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {students
                    .filter(s => {
                      const inThisGroup = editingGroup.memberIds.includes(s.id);
                      if (editFilter === 'in_group' && !inThisGroup) return false;
                      if (editFilter === 'unassigned' && (assignedMap[s.id] && assignedMap[s.id].id !== editingGroup.id)) return false;
                      if (!editSearch.trim()) return true;
                      const q = editSearch.toLowerCase();
                      return s.name.toLowerCase().includes(q) || (s.student_code || s.username || '').includes(q);
                    })
                    .map(s => {
                      const isSelected = editingGroup.memberIds.includes(s.id);
                      const currentGroup = assignedMap[s.id];
                      const isLeader = editingGroup.leaderId === s.id;
                      const isFromOtherGroup = currentGroup && currentGroup.id !== editingGroup.id;

                      return (
                        <div 
                          key={s.id}
                          onClick={() => {
                            if (isSelected) {
                              const nextIds = editingGroup.memberIds.filter(id => id !== s.id);
                              let nextLeader = editingGroup.leaderId;
                              if (nextLeader === s.id) {
                                nextLeader = nextIds.length > 0 ? nextIds[0] : null;
                              }
                              setEditingGroup({ ...editingGroup, memberIds: nextIds, leaderId: nextLeader });
                            } else {
                              const nextIds = [...editingGroup.memberIds, s.id];
                              let nextLeader = editingGroup.leaderId || s.id;
                              setEditingGroup({ ...editingGroup, memberIds: nextIds, leaderId: nextLeader });
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 px-3 cursor-pointer text-xs transition ${
                            isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-primary focus:ring-primary w-4 h-4"
                            />
                            <div>
                              <span className="font-semibold text-gray-800">{s.name}</span>
                              <span className="text-gray-400 ml-1.5 font-mono">({s.student_code || s.username})</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isFromOtherGroup && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                จาก: {currentGroup.name} (จะถูกย้าย)
                              </span>
                            )}
                            {!currentGroup && !isSelected && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                ยังไม่มีกลุ่ม
                              </span>
                            )}
                            {isSelected && (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingGroup({ ...editingGroup, leaderId: s.id });
                                }}
                                className={`p-1 rounded-md transition ${
                                  isLeader ? 'bg-amber-400 text-white shadow-xs' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
                                }`}
                                title={isLeader ? 'หัวหน้ากลุ่ม' : 'คลิกเพื่อตั้งเป็นหัวหน้ากลุ่ม'}
                              >
                                <Crown size={14}/>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setEditingGroup(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-100"
              >
                ยกเลิก
              </button>
              <button 
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-60"
              >
                {savingEdit ? 'กำลังบันทึก...' : '✅ บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. Modal: สุ่มจัดกลุ่ม (Random Group Modal) */}
      {/* ========================================================= */}
      {showRandomModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Shuffle size={18}/>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">สุ่มจัดกลุ่มให้อัตโนมัติ</h3>
                  <p className="text-xs text-gray-400">ระบบจะแบ่งนักเรียน {students.length} คนให้เท่าๆ กัน</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRandomModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200 transition"
              >
                <X size={18}/>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  จำนวนกลุ่มที่ต้องการ
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min={2} 
                    max={15} 
                    value={numGroups}
                    onChange={e => setNumGroups(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="w-12 text-center text-lg font-black text-indigo-700 bg-indigo-50 py-1 rounded-xl border border-indigo-200">
                    {numGroups}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-800 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles size={14}/> รายละเอียดการแบ่งกลุ่ม:
                </p>
                <p>• นักเรียนทั้งหมด: <b>{students.length}</b> คน</p>
                <p>• แบ่งออกเป็น: <b>{numGroups}</b> กลุ่ม</p>
                <p>• เฉลี่ยกลุ่มละ: <b>~{Math.round(students.length / numGroups)}</b> คน ({Math.floor(students.length / numGroups)} - {Math.ceil(students.length / numGroups)} คน/กลุ่ม)</p>
                <p className="text-red-500 pt-1 text-[11px]">
                  ⚠️ หมายเหตุ: การสุ่มใหม่จะล้างกลุ่มเดิมทั้งหมด
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowRandomModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-100"
              >
                ยกเลิก
              </button>
              <button 
                type="button"
                onClick={handleRandom}
                disabled={randomizing}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md transition disabled:opacity-60 flex items-center gap-2"
              >
                <Shuffle size={16}/> {randomizing ? 'กำลังสุ่ม...' : 'เริ่มสุ่มจัดกลุ่มทันที'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. Modal: Quick Add Member to Group */}
      {/* ========================================================= */}
      {quickAddGroup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-800 text-base">เพิ่มสมาชิกเข้า "{quickAddGroup.name}"</h3>
                <p className="text-xs text-gray-400">เลือกนักเรียนที่ต้องการเพิ่ม</p>
              </div>
              <button 
                onClick={() => setQuickAddGroup(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <X size={16}/>
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-gray-400"/>
                <input 
                  type="text"
                  value={quickAddSearch}
                  onChange={e => setQuickAddSearch(e.target.value)}
                  placeholder="ค้นหานักเรียน..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border rounded-xl">
                {students
                  .filter(s => {
                    if (quickAddGroup.members?.some(m => m.id === s.id)) return false;
                    if (!quickAddSearch.trim()) return true;
                    const q = quickAddSearch.toLowerCase();
                    return s.name.toLowerCase().includes(q) || (s.student_code || s.username || '').includes(q);
                  })
                  .map(s => {
                    const currentG = assignedMap[s.id];
                    return (
                      <div 
                        key={s.id}
                        onClick={() => handleQuickAdd(quickAddGroup.id, s.id)}
                        className="flex items-center justify-between p-2.5 px-3 hover:bg-primary/5 cursor-pointer text-xs transition"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">{s.name}</p>
                          <p className="text-gray-400 text-[11px]">{s.student_code || s.username}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {currentG ? (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                              ย้ายจาก {currentG.name}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                              ยังไม่มีกลุ่ม
                            </span>
                          )}
                          <span className="text-primary font-bold">+ เพิ่ม</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 text-right">
              <button 
                onClick={() => setQuickAddGroup(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
