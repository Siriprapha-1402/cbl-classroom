import React from 'react';

export default function StatCard({ icon, title, value, subtitle, colorClass = 'text-primary bg-primary/10' }) {
  return (
    <div className="card hover:-translate-y-1 transition-transform">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
          {subtitle && <p className="text-sm text-gray-400 mt-2">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
