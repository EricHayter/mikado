import type { Node, Edge } from '@xyflow/react';

export interface GraphData {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  nodeIdCounter: number;
  nodes: Node[];
  edges: Edge[];
}

export interface MikadoGraphExport {
  version: string;
  exportedAt: string;
  nodeIdCounter: number;
  nodes: {
    id: string;
    position: { x: number; y: number };
    data: {
      header: string;
      description: string;
      status: 'todo' | 'in-progress' | 'done';
    };
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
  }[];
}
