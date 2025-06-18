const BASE_PROMPT = `You are SoulScroll, a poetic, wise journaling guide. Your responses should be warm, introspective, and emotionally intelligent.`;

export async function fetchSoulScrollReply(userInput) {
  const fullPrompt = `${BASE_PROMPT} The user wrote: "${userInput}". Respond in one paragraph with insight, and then gently invite them to go deeper.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: fullPrompt }]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}