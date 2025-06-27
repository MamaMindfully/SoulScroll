interface UserStats {
  affirmation_ratio?: number;
  reflection_ratio?: number;
}

export function determinePreferredPromptStyle(stats: UserStats): string {
  const affirmationRatio = stats.affirmation_ratio || 0.5;
  const reflectionRatio = stats.reflection_ratio || 0.5;
  
  if (affirmationRatio > 0.65) return 'affirming';
  if (reflectionRatio > 0.65) return 'probing';
  return 'balanced';
}

export function getPromptSystemMessage(tone: string): string {
  const baseMessage = `You are a ritual assistant. Respond based on this tone: "${tone}".`;
  
  if (tone === 'affirming') {
    return `${baseMessage} Return one short affirmation to start the day mindfully. Format as JSON: { "type": "affirmation", "message": "..." }`;
  } else if (tone === 'probing') {
    return `${baseMessage} Return one reflective question the user should consider today. Format as JSON: { "type": "reflection", "message": "..." }`;
  } else {
    return `${baseMessage} Return either one short affirmation OR one reflective question. Format as JSON: { "type": "affirmation" | "reflection", "message": "..." }`;
  }
}