import OpenAI from 'openai';
import { storage } from '../storage.js';
import { logger } from './logger.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function runMemoryLoop(userId) {
  try {
    logger.info('Running memory loop for user', { userId })

    // Get journal entries from 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const entries = await storage.getJournalEntries(userId, 1, 0)
    
    if (!entries || entries.length === 0) {
      logger.info('No entries found for memory loop', { userId })
      return
    }

    const oldEntry = entries[0]
    
    // Only process entries that are actually from 30+ days ago
    if (new Date(oldEntry.createdAt) > thirtyDaysAgo) {
      logger.info('Entry too recent for memory loop processing', { userId, entryDate: oldEntry.createdAt })
      return
    }

    const prompt = `30 days ago, the user wrote: "${oldEntry.content || oldEntry.insight}"\n\nWrite a short paragraph of reflective insight. What were they learning? What changed?`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      max_tokens: 200
    })

    const reflection = response.choices[0].message.content.trim()

    // Store the memory loop insight
    await storage.createMemoryLoop(userId, {
      entryId: oldEntry.id,
      insight: reflection
    })

    logger.info('Memory loop insight created', { userId, entryId: oldEntry.id })
    return reflection

  } catch (error) {
    logger.error('Memory loop processing failed', { error: error.message, userId })
    throw error
  }
}

export { runMemoryLoop };