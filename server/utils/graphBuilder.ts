import { storage } from '../storage';
import { logger } from './logger';
import OpenAI from 'openai';
import { retryOpenAICall } from './retryUtils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface InsightNodeData {
  userId: string;
  entryId: number;
  label: string;
  emotion?: string;
  theme?: string;
}

export async function extractThemeFromEntry(content: string): Promise<string> {
  try {
    const prompt = `
What is the dominant emotional theme of this journal entry? Return one word only.

Examples: grief, growth, control, identity, release, love, uncertainty, peace, transformation, healing

Journal entry:
"${content}"

Theme (one word):
    `;

    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10
      }),
      'theme-extraction'
    );

    const theme = response.choices[0].message.content?.trim().toLowerCase() || 'reflection';
    
    logger.info('Theme extracted from journal entry', { 
      contentLength: content.length,
      theme 
    });

    return theme;

  } catch (error: any) {
    logger.warn('Failed to extract theme, using fallback', { 
      error: error.message 
    });
    return 'reflection';
  }
}

export async function insertInsightNode(data: InsightNodeData): Promise<number | null> {
  try {
    const { userId, entryId, label, emotion, theme } = data;

    logger.info('Creating insight node', { 
      userId, 
      entryId, 
      label: label.substring(0, 30) + '...',
      emotion,
      theme 
    });

    // Find the latest constellation to associate this node with
    const latestConstellation = await storage.getLatestConstellation(userId);
    let constellationId = null;

    if (latestConstellation) {
      // Check if the constellation is recent (within last 35 days)
      const daysSinceConstellation = Math.floor(
        (Date.now() - new Date(latestConstellation.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceConstellation <= 35) {
        constellationId = latestConstellation.id;
      }
    }

    // Create the insight node
    const savedNode = await storage.createInsightNode(userId, {
      entryId,
      label: label.slice(0, 200), // Truncate for display
      emotion,
      theme,
      constellationId
    });

    // Get recent nodes for edge creation
    const recentNodes = await storage.getRecentInsightNodes(userId, 10);
    const otherNodes = recentNodes.filter(n => n.id !== savedNode.id);

    // Create edges based on relationships
    const newEdges = [];

    for (const node of otherNodes) {
      // Theme connection
      if (node.theme && theme && node.theme === theme) {
        newEdges.push({
          source: savedNode.id,
          target: node.id,
          type: 'theme'
        });
      }

      // Emotion connection
      if (node.emotion && emotion && node.emotion === emotion) {
        newEdges.push({
          source: savedNode.id,
          target: node.id,
          type: 'emotion'
        });
      }

      // Time proximity connection (within 3 days)
      if (node.createdAt) {
        const daysDiff = Math.abs(
          (new Date().getTime() - new Date(node.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysDiff < 3) {
          newEdges.push({
            source: savedNode.id,
            target: node.id,
            type: 'time'
          });
        }
      }
    }

    // Save edges to database
    for (const edgeData of newEdges) {
      await storage.createInsightEdge(userId, edgeData);
    }

    logger.info('Insight node and edges created', { 
      userId,
      nodeId: savedNode.id,
      edgeCount: newEdges.length
    });

    return savedNode.id;

  } catch (error: any) {
    logger.error('Failed to create insight node', { 
      error: error.message,
      userId: data.userId,
      entryId: data.entryId
    });
    return null;
  }
}