import { useCallback, useState } from 'react';
import dagre from 'dagre';
import {
  ReactFlow,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import MikadoNode from './components/MikadoNode';
import './App.css';

const nodeTypes = {
  mikado: MikadoNode,
};

const getLaidOutElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 280, height: 200 });
  });

  edges.forEach((edge) => {
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

  return { nodes: laidOutNodes, edges };
};

const initialNodesRaw: Node[] = [
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

const initialEdges: Edge[] = [];

const { nodes: initialNodes, edges: initialEdgesLaidOut } = getLaidOutElements(initialNodesRaw, initialEdges);

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesLaidOut);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);

  const addChildNode = useCallback((parentId: string) => {
    const newNode: Node = {
      id: `${nodeIdCounter}`,
      type: 'mikado',
      position: { x: 0, y: 0 }, // Will be positioned by dagre
      data: {
        header: 'New Task',
        description: '',
        status: 'todo',
      },
    };

    // Create edge from parent to child
    const newEdge: Edge = {
      id: `e${parentId}-${nodeIdCounter}`,
      source: parentId,
      target: `${nodeIdCounter}`,
    };

    const newNodes = [...nodes, newNode];
    const newEdges = [...edges, newEdge];

    // Apply dagre layout
    const { nodes: laidOutNodes, edges: laidOutEdges } = getLaidOutElements(newNodes, newEdges);

    setNodes(laidOutNodes);
    setEdges(laidOutEdges);
    setNodeIdCounter((id) => id + 1);
  }, [nodeIdCounter, nodes, edges, setNodes, setEdges]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onDelete: deleteNode,
            onAddChild: addChildNode
          }
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default App;
