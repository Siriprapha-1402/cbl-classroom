/**
 * Helper to resolve the logged-in student's group reliably.
 * Ensures the student sees their group in all situations:
 * - If backend / mockApi returns myGroup directly
 * - If myGroup is null but student is inside one of the groups in groups list
 * - Checks id, student_id, student_code, username, and full name
 * - Handles session/localStorage hydration fallback
 */
export function resolveStudentGroup(groupResData, currentUser) {
  if (!groupResData) return null;

  // Resolve current student user (fallback to sessionStorage/localStorage if not yet hydrated)
  let user = currentUser;
  if (!user && typeof window !== 'undefined') {
    try {
      const s = sessionStorage.getItem('cbl_user');
      if (s) user = JSON.parse(s);
      else {
        const l = localStorage.getItem('cbl_user');
        if (l) user = JSON.parse(l);
      }
    } catch (e) {}
  }

  const groupsList = groupResData.groups || (Array.isArray(groupResData) ? groupResData : []);

  // 1. If myGroup is directly provided
  if (groupResData.myGroup) {
    // If we have user, verify that user actually belongs to this group or has no conflict
    if (!user) return groupResData.myGroup;

    const uid = String(user.id || '').trim();
    const ucode = String(user.student_id || user.username || '').trim().toLowerCase();
    const uname = String(user.name || '').trim().toLowerCase();

    const isMemberOfMyGroup = Array.isArray(groupResData.myGroup.members) && groupResData.myGroup.members.some(m => {
      const mid = String(m.id || '').trim();
      const mcode = String(m.student_code || m.username || m.student_id || '').trim().toLowerCase();
      const mname = String(m.name || '').trim().toLowerCase();
      return (uid && mid && uid === mid) ||
             (ucode && mcode && ucode === mcode) ||
             (uname && mname && (uname === mname || uname.includes(mname) || mname.includes(uname)));
    });

    if (isMemberOfMyGroup || !groupResData.myGroup.members || groupResData.myGroup.members.length === 0) {
      return groupResData.myGroup;
    }
  }

  // 2. Search dynamically across all groups
  if (!Array.isArray(groupsList) || groupsList.length === 0 || !user) {
    return null;
  }

  const uid = String(user.id || '').trim();
  const ucode = String(user.student_id || user.username || '').trim().toLowerCase();
  const uname = String(user.name || '').trim().toLowerCase();

  const found = groupsList.find(g => 
    Array.isArray(g.members) && g.members.some(m => {
      const mid = String(m.id || '').trim();
      const mcode = String(m.student_code || m.username || m.student_id || '').trim().toLowerCase();
      const mname = String(m.name || '').trim().toLowerCase();

      return (uid && mid && uid === mid) ||
             (ucode && mcode && ucode === mcode) ||
             (uname && mname && (uname === mname || uname.includes(mname) || mname.includes(uname)));
    })
  );

  return found || null;
}
