import React from 'react';
import { Lock, CheckCircle2, Play } from 'lucide-react';

export default function MissionCard({ mission, status, onComplete, index }) {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  return (
    <div className={`rounded-xl border-2 p-5 mb-4 relative transition-all ${
      isLocked ? 'bg-gray-50 border-gray-200 opacity-75' : 
      isCompleted ? 'bg-success/5 border-success/30 shadow-sm' : 
      'bg-white border-primary shadow-md transform hover:-translate-y-1'
    }`}>
      {/* Number Badge */}
      <div className={`absolute -left-3 -top-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
        isLocked ? 'bg-gray-400' : isCompleted ? 'bg-success' : 'bg-primary'
      }`}>
        {index + 1}
      </div>

      <div className="flex items-start justify-between ml-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h4 className={`font-bold text-lg ${isLocked ? 'text-gray-500' : 'text-gray-800'}`}>
              {mission.title}
            </h4>
            <span className="text-xs font-bold px-2 py-1 rounded bg-accent/20 text-yellow-700">
              +{mission.xp} XP
            </span>
          </div>
          <p className={`text-sm ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
            {mission.description}
          </p>
        </div>
        
        <div className="ml-4 flex-shrink-0 flex items-center justify-center h-full">
          {isLocked && <Lock className="text-gray-400" size={28} />}
          {isCompleted && <CheckCircle2 className="text-success" size={32} />}
          {isInProgress && (
            <button 
              onClick={() => onComplete(mission.id)}
              className="btn-primary flex items-center gap-2 py-2 px-4 text-sm animate-pulse hover:animate-none"
            >
              <Play size={16} /> ทำภารกิจ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
