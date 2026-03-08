import type { Node, Edge } from '@xyflow/react';
import type { GraphData, MikadoGraphExport } from '../types';
import { initialNodesRaw, initialEdges } from '../constants';
import { getLaidOutElements } from './layout';

export const validateImportData = (data: any): asserts data is MikadoGraphExport => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid file format: Expected JSON object');
  }
  if (!data.version || typeof data.version !== 'string') {
    throw new Error('Invalid file format: Missing version field');
  }
  if (!Array.isArray(data.nodes)) {
    throw new Error('Invalid file format: Missing or invalid nodes array');
  }
  if (!Array.isArray(data.edges)) {
    throw new Error('Invalid file format: Missing or invalid edges array');
  }
  if (typeof data.nodeIdCounter !== 'number') {
    throw new Error('Invalid file format: Missing or invalid nodeIdCounter');
  }

  // Validate each node
  data.nodes.forEach((node: any, index: number) => {
    if (!node.id || typeof node.id !== 'string') {
      throw new Error(`Invalid node at index ${index}: Missing id`);
    }
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      throw new Error(`Invalid node at index ${index}: Invalid position`);
    }
    if (!node.data || typeof node.data.header !== 'string') {
      throw new Error(`Invalid node at index ${index}: Invalid data.header`);
    }
    if (!['todo', 'in-progress', 'done'].includes(node.data.status)) {
      throw new Error(`Invalid node at index ${index}: Invalid status`);
    }
  });

  // Validate each edge
  data.edges.forEach((edge: any, index: number) => {
    if (!edge.id || !edge.source || !edge.target) {
      throw new Error(`Invalid edge at index ${index}: Missing required fields`);
    }
  });
};

export const createDefaultGraph = (name: string = 'Graph 1'): GraphData => {
  const { nodes: laidOutNodes, edges: laidOutEdges } = getLaidOutElements(initialNodesRaw, initialEdges);
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    nodeIdCounter: 2,
    nodes: laidOutNodes,
    edges: laidOutEdges,
  };
};

export const generateGraphName = (existingGraphs: Map<string, GraphData>): string => {
  let counter = 1;
  let name = `Graph ${counter}`;

  while (Array.from(existingGraphs.values()).some(g => g.name === name)) {
    counter++;
    name = `Graph ${counter}`;
  }

  return name;
};

export const createExportData = (
  nodes: Node[],
  edges: Edge[],
  nodeIdCounter: number
): MikadoGraphExport => {
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    nodeIdCounter,
    nodes: nodes.map(node => ({
      id: node.id,
      position: node.position,
      data: {
        header: node.data.header,
        description: node.data.description,
        status: node.data.status,
      }
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }))
  };
};
