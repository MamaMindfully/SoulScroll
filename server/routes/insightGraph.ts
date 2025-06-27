import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureError } from "../utils/errorHandler";

const router = Router();

// Get insight graph data
router.get('/api/insight-graph', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    logger.info('Fetching insight graph', { userId });

    const graphData = await storage.getInsightGraph(userId as string);
    const constellations = await storage.getMonthlyConstellations(userId as string, 12);

    // Format nodes for D3 visualization
    const formattedNodes = graphData.nodes.map(node => ({
      id: node.id,
      label: node.label,
      theme: node.theme,
      emotion: node.emotion,
      entryId: node.entryId,
      constellationId: node.constellationId,
      createdAt: node.createdAt
    }));

    // Format edges for D3 visualization
    const formattedEdges = graphData.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type
    }));

    // Format constellations for visualization
    const formattedConstellations = constellations.map(constellation => ({
      id: constellation.id,
      title: constellation.title,
      themes: constellation.themes || [],
      summary: constellation.summary,
      guidingQuestion: constellation.guidingQuestion,
      createdAt: constellation.createdAt
    }));

    res.json({
      nodes: formattedNodes,
      edges: formattedEdges,
      constellations: formattedConstellations
    });

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'fetch_insight_graph'
    });

    logger.error('Failed to fetch insight graph', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({ error: 'Failed to fetch insight graph' });
  }
});

// Get insight graph statistics
router.get('/api/insight-graph/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    const graphData = await storage.getInsightGraph(userId as string);

    // Calculate statistics
    const themeFrequency = {};
    const emotionFrequency = {};
    const connectionTypes = { theme: 0, emotion: 0, time: 0 };

    graphData.nodes.forEach(node => {
      if (node.theme) {
        themeFrequency[node.theme] = (themeFrequency[node.theme] || 0) + 1;
      }
      if (node.emotion) {
        emotionFrequency[node.emotion] = (emotionFrequency[node.emotion] || 0) + 1;
      }
    });

    graphData.edges.forEach(edge => {
      if (edge.type && connectionTypes.hasOwnProperty(edge.type)) {
        connectionTypes[edge.type]++;
      }
    });

    const stats = {
      totalNodes: graphData.nodes.length,
      totalEdges: graphData.edges.length,
      topThemes: Object.entries(themeFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      topEmotions: Object.entries(emotionFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      connectionTypes
    };

    res.json(stats);

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'fetch_graph_stats'
    });

    logger.error('Failed to fetch graph statistics', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;