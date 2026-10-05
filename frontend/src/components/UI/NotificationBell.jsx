import React, { useState } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  const [unread] = useState(2);
  
  return (
    <button className="relative p-2 text-gray-500 hover:text-primary transition-colors bg-gray-50 rounded-full hover:bg-primary/10">
      <Bell size={24} />
      {unread > 0 && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></span>
      )}
    </button>
  );
}
