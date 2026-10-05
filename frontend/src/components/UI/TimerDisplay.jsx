import React, { useState, useEffect } from 'react';

export default function TimerDisplay({ endTime, onAlert }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(1); // avoid /0

  useEffect(() => {
    if (!endTime) return;
    const end = new Date(endTime).getTime();
    const start = end - 60 * 60 * 1000; // Assume 1 hour total for visual if not provided
    setTotalTime(end - start);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(0);
        return;
      }
      setTimeLeft(distance);
      
      const minutesLeft = Math.floor(distance / (1000 * 60));
      if (minutesLeft === 10 && Math.floor((distance % 60000) / 1000) === 0) onAlert?.('10min');
      if (minutesLeft === 5 && Math.floor((distance % 60000) / 1000) === 0) onAlert?.('5min');
      if (minutesLeft === 1 && Math.floor((distance % 60000) / 1000) === 0) onAlert?.('1min');

    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!endTime) return null;

  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const percentage = (timeLeft / totalTime) * 100;
  
  let color = 'bg-success text-success';
  if (percentage < 25) color = 'bg-warning text-warning';
  if (percentage < 10) color = 'bg-danger text-danger';

  return (
    <div className="card text-center mb-6 border-2 border-gray-100 relative overflow-hidden">
      <div className={`absolute bottom-0 left-0 h-1 transition-all ${color.split(' ')[0]}`} style={{ width: `${percentage}%` }} />
      <p className="text-sm font-bold text-gray-500 tracking-wider mb-2">TIME REMAINING</p>
      <div className={`text-4xl md:text-5xl font-mono font-bold tracking-tight ${color.split(' ')[1]}`}>
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}
