import { mentorPersonas, getPersonaByKey, formatPersonaPrompt } from '../constants/mentorPersonas';
import { apiRequest } from '../lib/queryClient';

export async function generateInsight(entryText, userId, context = '') {
  try {
    // Get user profile to determine mentor persona
    const userResponse = await apiRequest('GET', '/api/auth/user');
    const userProfile = await userResponse.json();
    
    const personaKey = userProfile.mentorPersona || 'sage';
    const persona = getPersonaByKey(personaKey);
    
    // Format the prompt with persona context
    const systemPrompt = formatPersonaPrompt(persona, context);
    
    const response = await apiRequest('POST', '/api/generate-insight-with-persona', {
      entry_text: entryText,
      user_id: userId,
      persona_key: personaKey,
      system_prompt: systemPrompt,
      context: context
    });

    const data = await response.json();
    return data.insight || generateFallbackInsight(entryText, persona);
  } catch (error) {
    console.error('Error generating persona-based insight:', error);
    return generateFallbackInsight(entryText);
  }
}

function generateFallbackInsight(entryText, persona = mentorPersonas.sage) {
  const fallbackInsights = {
    sage: [
      "Your words reveal a wisdom that comes from experience. What deeper truth do you see emerging?",
      "In the quiet spaces between your thoughts, what wisdom is waiting to be discovered?",
      "Your journey shows the patience of someone who understands that growth takes time."
    ],
    poet: [
      "Your words dance like light on water, revealing depths beneath the surface.",
      "There's a rhythm in your thoughts that speaks to the music of your soul.",
      "Your experiences are verses in the poem of your becoming."
    ],
    coach: [
      "I hear strength in your words. What's one action you can take today to move forward?",
      "You have the power to shape your story. What's your next bold move?",
      "Your insights show you're ready to level up. What will you commit to?"
    ],
    friend: [
      "I hear you, and your feelings are completely valid. You're doing better than you think.",
      "Thank you for sharing this with me. Your honesty and vulnerability are beautiful.",
      "You're not alone in this. What you're feeling makes total sense."
    ]
  };

  const insights = fallbackInsights[persona.name.toLowerCase()] || fallbackInsights.sage;
  return insights[Math.floor(Math.random() * insights.length)];
}

export async function generatePersonalizedResponse(entryText, userId, persona, previousEntries = []) {
  try {
    const contextualPrompt = `
${formatPersonaPrompt(persona)}

The user has written: "${entryText}"

${previousEntries.length > 0 ? `
Previous context from recent entries:
${previousEntries.slice(0, 3).map(entry => `- ${entry.content.substring(0, 100)}...`).join('\n')}
` : ''}

Provide a thoughtful, personalized response that matches your persona. Be genuine, supportive, and offer meaningful insight.
`;

    const response = await apiRequest('POST', '/api/generate-personalized-response', {
      prompt: contextualPrompt,
      persona_key: persona.name.toLowerCase(),
      entry_text: entryText,
      user_id: userId
    });

    const data = await response.json();
    return data.response || generateFallbackInsight(entryText, persona);
  } catch (error) {
    console.error('Error generating personalized response:', error);
    return generateFallbackInsight(entryText, persona);
  }
}

export async function generateDeepInsightWithPersona(entryText, userId, depth = 1) {
  try {
    // Get user's mentor persona
    const userResponse = await apiRequest('GET', '/api/auth/user');
    const userProfile = await userResponse.json();
    
    const personaKey = userProfile.mentorPersona || 'sage';
    const persona = getPersonaByKey(personaKey);
    
    const depthPrompts = {
      1: "Let's explore this more deeply. What emotions are beneath the surface?",
      2: "What patterns do you notice in your thoughts and feelings?", 
      3: "How does this connect to your deeper values and beliefs?",
      4: "What would your wisest self say about this situation?",
      5: "What sacred truth is emerging from this experience?"
    };

    const contextPrompt = `
${formatPersonaPrompt(persona)}

The user wrote: "${entryText}"

This is depth level ${depth}. ${depthPrompts[depth] || depthPrompts[1]}

Respond with the depth and style that matches your persona, guiding them to profound self-discovery.
`;

    const response = await apiRequest('POST', '/api/generate-deep-insight', {
      prompt: contextPrompt,
      persona_key: personaKey,
      depth_level: depth,
      entry_text: entryText
    });

    const data = await response.json();
    return data.insight || generateFallbackInsight(entryText, persona);
  } catch (error) {
    console.error('Error generating deep insight with persona:', error);
    return generateFallbackInsight(entryText);
  }
}