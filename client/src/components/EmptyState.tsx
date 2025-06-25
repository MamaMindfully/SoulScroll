import React from "react";
export function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center p-10 opacity-80">
      <svg width="120" height="120" viewBox="0 0 120 120" className="mb-6">
        <circle cx="60" cy="60" r="55" fill="#E0E7FF" stroke="#6366F1" strokeWidth="4" />
        <text x="50%" y="52%" textAnchor="middle" fontSize="38" fill="#6366F1" dy=".3em">📝</text>
      </svg>
      <p className="text-xl text-gray-500">{message}</p>
    </div>
  );
}
