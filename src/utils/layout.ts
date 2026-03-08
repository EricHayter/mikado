import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

export const getLaidOutElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 100 });

  // Create a set of valid node IDs for quick lookup
  const nodeIds = new Set(nodes.map(n => n.id));

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 280, height: 200 });
  });

  // Filter out edges that reference non-existent nodes
  const validEdges = edges.filter(edge => {
    const isValid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
    if (!isValid) {
      console.warn(`Skipping invalid edge ${edge.id}: source=${edge.source}, target=${edge.target}`);
    }
    return isValid;
  });

  validEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const laidOutNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x,
        y: nodeWithPosition.y,
      },
    };
  });

  return { nodes: laidOutNodes, edges: validEdges };
};
