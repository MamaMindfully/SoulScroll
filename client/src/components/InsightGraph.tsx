import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Node {
  id: number;
  label: string;
  theme?: string;
  emotion?: string;
  entryId?: number;
  constellationId?: number;
  createdAt?: string;
}

interface Edge {
  source: number;
  target: number;
  type: string;
}

interface Constellation {
  id: number;
  title: string;
  themes: string[];
  summary: string;
  guidingQuestion?: string;
  createdAt: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  constellations: Constellation[];
}

interface InsightGraphProps {
  data: GraphData;
}

const InsightGraph: React.FC<InsightGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.nodes || !svgRef.current) return;

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;
    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .style('background', 'linear-gradient(135deg, #0b0c10 0%, #1f2937 100%)')
      .style('border-radius', '12px');

    // Clear previous content
    svg.selectAll('*').remove();

    // Apply theme filtering
    const filteredNodes = activeTheme
      ? data.nodes.filter(n => n.theme === activeTheme)
      : data.nodes;

    const fadedNodes = data.nodes.map(n => ({
      ...n,
      opacity: activeTheme ? (n.theme === activeTheme ? 1 : 0.1) : 1
    }));

    // Group nodes by constellation
    const nodesByConstellation = new Map();
    fadedNodes.forEach(node => {
      const constellationId = node.constellationId || 'unassigned';
      if (!nodesByConstellation.has(constellationId)) {
        nodesByConstellation.set(constellationId, []);
      }
      nodesByConstellation.get(constellationId).push(node);
    });

    // Initialize constellation groups container (will be populated dynamically in tick)
    const constellationContainer = svg.append('g').attr('class', 'constellations');

    // Create simulation with constellation clustering
    const simulation = d3.forceSimulation(fadedNodes as any)
      .force('link', d3.forceLink(data.edges).id((d: any) => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(12));

    // Add gradient definitions
    const defs = svg.append('defs');
    
    // Theme color gradients
    const gradients = [
      { id: 'grief', colors: ['#8b5cf6', '#a78bfa'] },
      { id: 'joy', colors: ['#10b981', '#34d399'] },
      { id: 'control', colors: ['#f59e0b', '#fbbf24'] },
      { id: 'identity', colors: ['#ec4899', '#f472b6'] },
      { id: 'release', colors: ['#38bdf8', '#60a5fa'] },
      { id: 'love', colors: ['#f87171', '#fb7185'] },
      { id: 'uncertainty', colors: ['#a855f7', '#c084fc'] },
      { id: 'peace', colors: ['#06b6d4', '#22d3ee'] },
      { id: 'transformation', colors: ['#84cc16', '#a3e635'] },
      { id: 'healing', colors: ['#22c55e', '#4ade80'] },
      { id: 'default', colors: ['#64748b', '#94a3b8'] }
    ];

    gradients.forEach(({ id, colors }) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${id}`)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colors[0])
        .attr('stop-opacity', 0.9);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colors[1])
        .attr('stop-opacity', 0.7);
    });

    // Create links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.edges)
      .join('line')
      .attr('stroke', (d) => getEdgeColor(d.type))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', (d) => d.type === 'time' ? '5,5' : null)
      .style('opacity', (d: any) => {
        if (!activeTheme) return 1;
        return (d.source.theme === activeTheme || d.target.theme === activeTheme) ? 1 : 0.1;
      });

    // Create nodes
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(fadedNodes)
      .join('circle')
      .attr('r', 10)
      .attr('fill', (d) => `url(#gradient-${getThemeId(d.theme)})`)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('opacity', (d: any) => d.opacity || 1)
      .call(drag(simulation) as any);

    // Add node labels
    const label = svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(fadedNodes)
      .join('text')
      .text((d) => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label)
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('fill', '#e5e7eb')
      .attr('text-anchor', 'middle')
      .attr('dy', 25)
      .style('pointer-events', 'none')
      .style('opacity', (d: any) => d.opacity || 1);

    // Add hover and click effects
    node
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 14)
          .attr('stroke-width', 3)
          .style('filter', 'drop-shadow(0 0 8px ' + getThemeColor(d.theme) + ')');

        // Show tooltip
        const constellation = data.constellations?.find(c => c.id === d.constellationId);
        const tooltip = d3.select('body').append('div')
          .attr('class', 'insight-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.9)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '6px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .style('opacity', 0)
          .style('max-width', '300px');

        tooltip.html(`
          <div><strong>${d.label}</strong></div>
          <div>Theme: ${d.theme || 'Unknown'}</div>
          <div>Emotion: ${d.emotion || 'Unknown'}</div>
          ${constellation ? `<div style="margin-top: 4px; font-style: italic;">Part of: ${constellation.title}</div>` : ''}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .transition()
          .duration(200)
          .style('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 10)
          .attr('stroke-width', 2)
          .style('filter', 'none');

        d3.selectAll('.insight-tooltip').remove();
      })
      .on('click', function(event, d) {
        const constellation = data.constellations?.find(c => c.id === d.constellationId);
        if (constellation && constellation.guidingQuestion) {
          // Show constellation details in a modal-like tooltip
          d3.selectAll('.constellation-detail').remove();
          
          const detail = d3.select('body').append('div')
            .attr('class', 'constellation-detail')
            .style('position', 'fixed')
            .style('top', '50%')
            .style('left', '50%')
            .style('transform', 'translate(-50%, -50%)')
            .style('background', 'rgba(0, 0, 0, 0.95)')
            .style('color', 'white')
            .style('padding', '20px')
            .style('border-radius', '12px')
            .style('max-width', '400px')
            .style('z-index', '2000')
            .style('border', '2px solid ' + getThemeColor(d.theme));

          detail.html(`
            <div style="text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #f3f4f6;">${constellation.title}</h3>
              <p style="margin: 10px 0; font-style: italic; color: #d1d5db;">"${constellation.guidingQuestion}"</p>
              <button onclick="this.parentElement.parentElement.remove()" 
                      style="margin-top: 15px; padding: 8px 16px; background: #374151; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Close
              </button>
            </div>
          `);
        }
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);

      // Dynamic constellation clustering
      const uniqueConstellations = [...new Set(fadedNodes.map(n => n.constellationId).filter(Boolean))];

      const constellationGroups = uniqueConstellations.map(id => {
        const members = fadedNodes.filter(n => n.constellationId === id);
        const cx = d3.mean(members, (n: any) => n.x) || 0;
        const cy = d3.mean(members, (n: any) => n.y) || 0;
        const r = Math.max(60, (d3.max(members.map((n: any) => Math.sqrt((n.x - cx)**2 + (n.y - cy)**2))) || 0) + 50);
        const constellation = data.constellations?.find(c => c.id === id);
        const themeColor = getConstellationColor(constellation?.themes?.[0]);
        const avgOpacity = d3.mean(members, (n: any) => n.opacity || 1) || 1;
        return { id, cx, cy, r, constellation, themeColor, opacity: avgOpacity };
      });

      // Render soft glowing constellation clusters
      svg.selectAll('circle.constellation')
        .data(constellationGroups)
        .join('circle')
        .attr('class', 'constellation')
        .attr('cx', d => d.cx)
        .attr('cy', d => d.cy)
        .attr('r', d => d.r)
        .attr('fill', d => d.themeColor)
        .attr('fill-opacity', 0.05)
        .attr('stroke', d => d.themeColor)
        .attr('stroke-dasharray', '4 2')
        .attr('stroke-opacity', 0.2)
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .style('opacity', (d: any) => d.opacity || 1)
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill-opacity', 0.15)
            .attr('stroke-opacity', 0.5);
        })
        .on('mouseout', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill-opacity', 0.05)
            .attr('stroke-opacity', 0.2);
        })
        .on('click', function(event, d) {
          if (d.constellation) {
            // Show constellation overview modal
            d3.selectAll('.constellation-overview').remove();
            
            const overview = d3.select('body').append('div')
              .attr('class', 'constellation-overview')
              .style('position', 'fixed')
              .style('top', '50%')
              .style('left', '50%')
              .style('transform', 'translate(-50%, -50%)')
              .style('background', 'rgba(0, 0, 0, 0.95)')
              .style('color', 'white')
              .style('padding', '24px')
              .style('border-radius', '16px')
              .style('max-width', '500px')
              .style('z-index', '2000')
              .style('border', '2px solid ' + d.themeColor)
              .style('box-shadow', '0 20px 40px rgba(0,0,0,0.3)');

            const memberCount = fadedNodes.filter(n => n.constellationId === d.id).length;
            
            overview.html(`
              <div style="text-align: center;">
                <h2 style="margin: 0 0 12px 0; color: #f3f4f6; font-size: 1.5rem;">${d.constellation.title}</h2>
                <div style="margin: 12px 0; font-size: 0.9rem; color: #d1d5db;">
                  <span style="color: ${d.themeColor};">●</span> ${memberCount} insights in this constellation
                </div>
                <p style="margin: 16px 0; font-style: italic; color: #e5e7eb; line-height: 1.5;">
                  "${d.constellation.summary}"
                </p>
                ${d.constellation.guidingQuestion ? `
                  <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p style="margin: 0; font-style: italic; color: #f9fafb; font-weight: 500;">
                      "${d.constellation.guidingQuestion}"
                    </p>
                  </div>
                ` : ''}
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-top: 20px; padding: 10px 20px; background: ${d.themeColor}; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                  Close Overview
                </button>
              </div>
            `);
          }
        });

      // Add constellation titles as floating labels
      svg.selectAll('text.constellation-title')
        .data(constellationGroups)
        .join('text')
        .attr('class', 'constellation-title')
        .attr('x', d => d.cx)
        .attr('y', d => d.cy - d.r - 15)
        .attr('text-anchor', 'middle')
        .attr('fill', d => d.themeColor)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('opacity', 0.8)
        .style('pointer-events', 'none')
        .text(d => d.constellation?.title || `Constellation ${d.id}`);
    });

    // Drag behavior
    function drag(simulation: any) {
      function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    function getThemeId(theme?: string): string {
      const validThemes = ['grief', 'joy', 'control', 'identity', 'release', 'love', 'uncertainty', 'peace', 'transformation', 'healing'];
      return validThemes.includes(theme || '') ? theme! : 'default';
    }

    function getThemeColor(theme?: string): string {
      const colors = {
        grief: '#8b5cf6',
        joy: '#10b981', 
        control: '#f59e0b',
        identity: '#ec4899',
        release: '#38bdf8',
        love: '#f87171',
        uncertainty: '#a855f7',
        peace: '#06b6d4',
        transformation: '#84cc16',
        healing: '#22c55e'
      };
      return colors[theme || 'default'] || '#64748b';
    }

    function getConstellationColor(theme?: string): string {
      return getThemeColor(theme);
    }

    function getEdgeColor(type: string): string {
      const colors = {
        theme: '#8b5cf6',
        emotion: '#f59e0b',
        time: '#10b981'
      };
      return colors[type] || '#64748b';
    }

    // Cleanup function
    return () => {
      simulation.stop();
      d3.selectAll('.insight-tooltip').remove();
    };

  }, [data, activeTheme]);

  return (
    <div className="relative">
      {/* Theme Filter */}
      <div className="absolute top-4 right-4 z-10">
        <select 
          onChange={e => setActiveTheme(e.target.value || null)} 
          className="p-2 rounded bg-black/70 text-white border border-gray-600 text-sm backdrop-blur-sm"
          value={activeTheme || ''}
        >
          <option value="">All Themes</option>
          {Array.from(new Set(data.nodes.map(n => n.theme).filter(Boolean))).map(theme => (
            <option key={theme} value={theme}>{theme}</option>
          ))}
        </select>
      </div>

      <div className="w-full h-[80vh] overflow-hidden rounded-xl">
        <svg ref={svgRef} className="w-full h-full border border-gray-700 rounded-lg shadow-lg" />
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white text-sm">
        <h4 className="font-semibold mb-2">Graph Elements</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <span>Individual Insights</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-purple-400 opacity-30 border border-purple-400 rounded"></div>
            <span>Monthly Constellations</span>
          </div>
          <div className="border-t border-gray-600 my-2"></div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-purple-400"></div>
            <span>Theme Links</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-amber-400"></div>
            <span>Emotion Links</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-emerald-400"></div>
            <span>Time Links</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-300">
          Click nodes to view constellation details
        </div>
      </div>
    </div>
  );
};

export default InsightGraph;