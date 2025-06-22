interface EmotionTrendData {
  userId: string;
  score: number;
  dominantEmotion: string;
}

export async function logEmotionTrend({ userId, score, dominantEmotion }: EmotionTrendData) {
  try {
    const response = await fetch('/api/emotion-trend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        score,
        dominantEmotion
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to log emotion trend: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error logging emotion trend:', error);
    throw error;
  }
}