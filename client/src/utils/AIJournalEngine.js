// AIJournalEngine.js
export async function getAIReflection(journalText, userIntent = 'self-discovery') {
  try {
    // Call our backend API instead of OpenAI directly
    const response = await fetch("/api/ai/reflection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: journalText,
        intent: userIntent
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.reflection || "I'm here when you're ready to reflect more.";
  } catch (error) {
    console.error('Error getting AI reflection:', error);
    return "I'm here when you're ready to reflect more.";
  }
}