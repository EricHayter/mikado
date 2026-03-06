import { useCallback, useState } from 'react';
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

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <button onClick={addNode} className="add-node-btn">
          + Add Node
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
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
