import React from 'react';

export default function BadgeCard({ badge, earned }) {
  return (
    <div className={`border-2 rounded-2xl p-4 text-center transition-all ${
      earned ? 'border-accent bg-accent/5 shadow-md shadow-accent/20 scale-105' : 'border-gray-200 bg-gray-50 grayscale opacity-60'
    }`}>
      <div className="text-5xl mb-3">{badge.icon || '🏆'}</div>
      <h4 className={`font-bold ${earned ? 'text-gray-800' : 'text-gray-500'}`}>{badge.name}</h4>
      <p className="text-xs text-gray-500 mt-2 h-10">{badge.description}</p>
      {earned && badge.earnedAt && (
        <div className="text-[10px] text-primary font-medium mt-3 bg-primary/10 rounded-full py-1">
          {new Date(badge.earnedAt).toLocaleDateString('th-TH')}
        </div>
      )}
    </div>
  );
}
