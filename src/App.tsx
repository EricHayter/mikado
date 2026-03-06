import { useCallback, useState } from 'react';
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

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'mikado',
    position: { x: 250, y: 50 },
    data: {
      header: 'Main Goal',
      description: 'The ultimate objective of this refactor',
      status: 'todo',
    },
  },
];

const initialEdges: Edge[] = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);

  const addChildNode = useCallback((parentId: string) => {
    // Find parent node to position child below it
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    // Count existing children to calculate horizontal offset
    const existingChildren = edges.filter(e => e.source === parentId).length;
    const horizontalSpacing = 200; // Spacing between siblings
    const xOffset = existingChildren * horizontalSpacing;

    const newNode: Node = {
      id: `${nodeIdCounter}`,
      type: 'mikado',
      position: {
        x: parentNode.position.x + xOffset,
        y: parentNode.position.y + 150, // Position 150px below parent
      },
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

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
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
