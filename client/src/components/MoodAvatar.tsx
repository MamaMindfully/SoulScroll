import React from "react";
const moods = {
  happy: { emoji: "😊", color: "#FDE68A" },
  sad: { emoji: "😢", color: "#93C5FD" },
  calm: { emoji: "😌", color: "#A7F3D0" },
  excited: { emoji: "🤩", color: "#FCA5A5" },
  neutral: { emoji: "😐", color: "#F3F4F6" },
  anxious: { emoji: "😬", color: "#FCD34D" }
};
export function MoodAvatar({ mood }) {
  const data = moods[mood] || moods["neutral"];
  return (
    <div className="flex items-center justify-center rounded-full" style={{ width: 64, height: 64, background: `radial-gradient(circle at 50% 50%, ${data.color}, #fff0)` }}>
      <span style={{ fontSize: "2.5rem" }}>{data.emoji}</span>
    </div>
  );
}
