import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export const LEVELS = [
  { level: 1, name: 'Beginner', nameT: 'ผู้เริ่มต้น', minXP: 0, maxXP: 199 },
  { level: 2, name: 'Explorer', nameT: 'นักสำรวจ', minXP: 200, maxXP: 499 },
  { level: 3, name: 'Creator', nameT: 'นักสร้างสรรค์', minXP: 500, maxXP: 999 },
  { level: 4, name: 'Problem Solver', nameT: 'นักแก้ปัญหา', minXP: 1000, maxXP: 1799 },
  { level: 5, name: 'Challenge Master', nameT: 'ผู้เชี่ยวชาญ', minXP: 1800, maxXP: 9999 },
];

export function getLevelInfo(xp) {
  const current = LEVELS.filter(l => xp >= l.minXP).pop() || LEVELS[0];
  const next = LEVELS.find(l => l.level === current.level + 1);
  const progress = next ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100 : 100;
  return { ...current, nextLevelXP: next?.minXP, progress: Math.min(progress, 100) };
}

export function formatDateTime(dt) {
  if (!dt) return '';
  return format(new Date(dt), 'dd MMM yyyy HH:mm', { locale: th });
}

export function getSubmissionStatusColor(status) {
  switch (status) {
    case 'on_time': return 'bg-success/10 text-success';
    case 'late': return 'bg-warning/10 text-warning';
    case 'not_submitted': return 'bg-danger/10 text-danger';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getSubmissionStatusText(status) {
  switch (status) {
    case 'on_time': return 'ตรงเวลา';
    case 'late': return 'ล่าช้า';
    case 'not_submitted': return 'ยังไม่ส่ง';
    default: return 'ไม่ทราบ';
  }
}
