// AIJournalEngine.js
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Make sure this is set in your Replit Secrets

export async function getAIReflection(journalText, userIntent = 'self-discovery') {
  const systemPrompt = `
You are SoulScroll, a gentle AI journaling companion.
Respond to the user's entry with emotionally intelligent reflections.
Your tone should match their journaling goal (e.g., self-discovery, creative expression, emotional clarity).
Do NOT give advice. Do NOT analyze clinically. Simply reflect, validate, and guide deeper introspection.

The user is writing for: ${userIntent}.
Their entry is:
"${journalText}"

Respond in 1–3 thoughtful paragraphs.
End with a simple, poetic follow-up question.
  `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: journalText }
      ],
      temperature: 0.8
    })
  });

  const data = await response.json();
  const aiText = data.choices?.[0]?.message?.content ?? "I'm here when you're ready to reflect more.";

  return aiText;
}