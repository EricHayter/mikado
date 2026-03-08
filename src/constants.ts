import type { Node, Edge } from '@xyflow/react';

export const STORAGE_KEYS = {
  GRAPHS: 'mikado-graphs',
  ACTIVE_GRAPH_ID: 'mikado-active-graph-id',
  SIDEBAR_STATE: 'mikado-sidebar-opened',
};

export const initialNodesRaw: Node[] = [
  {
    id: '1',
    type: 'mikado',
    position: { x: 0, y: 0 },
    data: {
      header: 'Main Goal',
      description: 'The ultimate objective of this refactor',
      status: 'todo',
    },
  },
];

export const initialEdges: Edge[] = [];
