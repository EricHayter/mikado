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
import { Group, Button, FileButton, Modal, TextInput, Stack } from '@mantine/core';
import { IconDownload, IconUpload } from '@tabler/icons-react';
import MikadoNode from './components/MikadoNode';
import './App.css';

const nodeTypes = {
  mikado: MikadoNode,
};

interface MikadoGraphExport {
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

const validateImportData = (data: any): asserts data is MikadoGraphExport => {
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
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState('');
  const [pendingExportData, setPendingExportData] = useState<string | null>(null);

  console.log('Modal open state:', exportModalOpen);

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

  const exportGraph = useCallback(async () => {
    console.log('Export button clicked');
    const exportData: MikadoGraphExport = {
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

    const jsonString = JSON.stringify(exportData, null, 2);
    const suggestedName = `mikado-graph-${new Date().toISOString().split('T')[0]}.json`;

    try {
      // Use File System Access API if available (Chrome, Edge)
      if (typeof (window as any).showSaveFilePicker === 'function') {
        console.log('Using showSaveFilePicker');
        const handle = await (window as any).showSaveFilePicker({
          suggestedName,
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
      } else {
        // Fallback: Show modal for filename input
        console.log('Using modal fallback');
        console.log('Setting modal open to true');
        setPendingExportData(jsonString);
        setExportFilename(suggestedName);
        setExportModalOpen(true);
      }
    } catch (error) {
      // User cancelled the save dialog or other error
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Export failed:', error);
        alert('Failed to export graph');
      }
    }
  }, [nodes, edges, nodeIdCounter]);

  const handleDownloadFromModal = useCallback(() => {
    if (!pendingExportData) return;

    const filename = exportFilename.endsWith('.json') ? exportFilename : `${exportFilename}.json`;
    const blob = new Blob([pendingExportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Close modal and clear state
    setExportModalOpen(false);
    setPendingExportData(null);
    setExportFilename('');
  }, [pendingExportData, exportFilename]);

  const handleFileImport = useCallback(async (file: File | null) => {
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      validateImportData(data);

      const importedNodes: Node[] = data.nodes.map(node => ({
        id: node.id,
        type: 'mikado',
        position: node.position,
        data: {
          header: node.data.header,
          description: node.data.description || '',
          status: node.data.status,
        }
      }));

      const importedEdges: Edge[] = data.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      }));

      const { nodes: laidOutNodes, edges: laidOutEdges } = getLaidOutElements(
        importedNodes,
        importedEdges
      );

      setNodes(laidOutNodes);
      setEdges(laidOutEdges);
      setNodeIdCounter(data.nodeIdCounter);

      console.log('Graph imported successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Import failed: ${message}`);
      console.error('Import error:', error);
    }
  }, [setNodes, setEdges, setNodeIdCounter]);

  return (
    <>
      <Modal
        opened={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Graph"
        centered
        zIndex={1000}
      >
        <Stack gap="md">
          <TextInput
            label="Filename"
            placeholder="Enter filename"
            value={exportFilename}
            onChange={(e) => setExportFilename(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleDownloadFromModal();
              }
            }}
          />
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setExportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleDownloadFromModal}
            >
              Download
            </Button>
          </Group>
        </Stack>
      </Modal>

      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Group justify="flex-end" p="md" style={{
          borderBottom: '1px solid #e9ecef',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          flexShrink: 0
        }}>
          <FileButton onChange={handleFileImport} accept="application/json,.json">
            {(props) => (
              <Button
                {...props}
                leftSection={<IconUpload size={14} />}
                variant="filled"
                color="blue"
                size="xs"
                radius="sm"
              >
                Import
              </Button>
            )}
          </FileButton>

          <Button
            onClick={exportGraph}
            leftSection={<IconDownload size={14} />}
            variant="filled"
            color="blue"
            size="xs"
            radius="sm"
          >
            Export
          </Button>
        </Group>

        <div style={{ flexGrow: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ maxZoom: 0.8 }}
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>
    </>
  );
}

export default App;
