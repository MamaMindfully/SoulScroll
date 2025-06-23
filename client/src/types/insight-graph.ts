// Type definitions for InsightGraph component
import * as d3 from 'd3';

export interface InsightNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  theme: string;
  emotion: string;
  constellation_id?: number;
  opacity?: number;
  x?: number;
  y?: number;
}

export interface InsightEdge extends d3.SimulationLinkDatum<InsightNode> {
  source: string | InsightNode;
  target: string | InsightNode;
  type: 'theme' | 'emotion' | 'time';
}

export interface Constellation {
  id: number;
  title: string;
  theme: string;
  center_x: number;
  center_y: number;
  radius: number;
}

export interface InsightGraphData {
  nodes: InsightNode[];
  edges: InsightEdge[];
  constellations: Constellation[];
}

export interface ThemeGradient {
  id: string;
  colors: [string, string];
}