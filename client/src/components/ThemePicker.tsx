import React from "react";
const themes = [
  { name: "Light", className: "theme-light" },
  { name: "Dark", className: "theme-dark" },
  { name: "Pastel", className: "theme-pastel" },
  { name: "Solarized", className: "theme-solarized" }
];
export function ThemePicker({ onChange }) {
  return (
    <div className="flex gap-2">
      {themes.map(t => (
        <button
          key={t.name}
          onClick={() => onChange(t.className)}
          className="rounded px-3 py-1 bg-gray-200 hover:bg-blue-200"
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
