// OpenAI utility for AI assistant functionality
export async function createCompletion(prompt: string, context: { system?: string } = {}): Promise<string> {
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        prompt,
        system: context.system || 'You are Arc, a gentle, soulful AI reflection coach. Answer thoughtfully and help the user reflect inward with wisdom and compassion.',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result || data.response || 'I\'m here to listen, but something went wrong. Please try again.';
  } catch (error) {
    console.error('OpenAI completion error:', error);
    return 'I apologize, but I\'m having trouble connecting right now. Your question is important - please try again in a moment.';
  }
}