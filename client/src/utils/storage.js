// Save and retrieve reflections
export function saveReflection(text, date) {
  const existing = JSON.parse(localStorage.getItem('scroll_entries') || '[]');
  existing.push({ text, date });
  localStorage.setItem('scroll_entries', JSON.stringify(existing));
}

export function getReflections() {
  return JSON.parse(localStorage.getItem('scroll_entries') || '[]');
}

// SoulSeed progress tracker
export function getReflectionCount() {
  return parseInt(localStorage.getItem('soulseed_count') || 0);
}

export function incrementReflectionCount() {
  const count = getReflectionCount() + 1;
  localStorage.setItem('soulseed_count', count);
}