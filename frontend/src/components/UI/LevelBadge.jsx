import React from 'react';
import { getLevelInfo } from '../../lib/utils';

export default function LevelBadge({ xp, size = 'md' }) {
  const levelInfo = getLevelInfo(xp);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-accent to-yellow-500 text-white rounded-full font-bold shadow-md ${sizeClasses[size]}`}>
      <span>Lv.{levelInfo.level}</span>
      <span className="border-l border-white/30 pl-2">{levelInfo.nameT}</span>
    </div>
  );
}
