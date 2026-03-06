import { useCallback, useState } from 'react';
import { Button } from '@mantine/core';
import {
  ReactFlow,
  type Node,
  type Edge,
  addEdge,
  type Connection,
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

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `${nodeIdCounter}`,
      type: 'mikado',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        header: 'New Task',
        description: '',
        status: 'todo',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((id) => id + 1);
  }, [nodeIdCounter, setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
        <Button onClick={addNode} leftSection="+" size="md">
          Add Node
        </Button>
      </div>
      <ReactFlow
        nodes={nodes.map(node => ({
          ...node,
          data: { ...node.data, onDelete: deleteNode }
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
