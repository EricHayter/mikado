import { useCallback, useState, useEffect } from 'react';
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
import {
  Group,
  Button,
  FileButton,
  Modal,
  TextInput,
  Stack,
  AppShell,
  NavLink,
  ScrollArea,
  ActionIcon,
  Divider,
  Text,
} from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import {
  IconDownload,
  IconUpload,
  IconPlus,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconTrash,
} from '@tabler/icons-react';
import MikadoNode from './components/MikadoNode';
import GraphListItem from './components/GraphListItem';
import './App.css';

const nodeTypes = {
  mikado: MikadoNode,
};

interface GraphData {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  nodeIdCounter: number;
  nodes: Node[];
  edges: Edge[];
}

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

const STORAGE_KEYS = {
  GRAPHS: 'mikado-graphs',
  ACTIVE_GRAPH_ID: 'mikado-active-graph-id',
  SIDEBAR_STATE: 'mikado-sidebar-opened',
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

const { nodes: initialNodes, edges: initialEdgesLaidOut} = getLaidOutElements(initialNodesRaw, initialEdges);

const createDefaultGraph = (name: string = 'Graph 1'): GraphData => {
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

const generateGraphName = (existingGraphs: Map<string, GraphData>): string => {
  let counter = 1;
  let name = `Graph ${counter}`;

  while (Array.from(existingGraphs.values()).some(g => g.name === name)) {
    counter++;
    name = `Graph ${counter}`;
  }

  return name;
};

function App() {
  const [graphs, setGraphs] = useState<Map<string, GraphData>>(new Map());
  const [activeGraphId, setActiveGraphId] = useState<string | null>(null);
  const [sidebarOpened, setSidebarOpened] = useState<boolean>(true);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesLaidOut);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState('');
  const [pendingExportData, setPendingExportData] = useState<string | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');

  console.log('Modal open state:', exportModalOpen);

  // Modal helpers
  const showAlert = useCallback((message: string) => {
    setAlertModalMessage(message);
    setAlertModalOpen(true);
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmModalConfig({ title, message, onConfirm });
    setConfirmModalOpen(true);
  }, []);

  // LocalStorage persistence
  const saveToStorage = useCallback((graphsMap: Map<string, GraphData>) => {
    try {
      localStorage.setItem(STORAGE_KEYS.GRAPHS, JSON.stringify(Array.from(graphsMap.entries())));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      setAlertModalMessage('Failed to save graphs. You may be running out of storage space.');
      setAlertModalOpen(true);
    }
  }, []);

  // Initialize graphs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.GRAPHS);
    const storedSidebarState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);

    if (storedSidebarState !== null) {
      setSidebarOpened(storedSidebarState === 'true');
    }

    if (stored) {
      try {
        const entries: [string, GraphData][] = JSON.parse(stored);
        const graphsMap = new Map(entries);
        setGraphs(graphsMap);

        const storedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_GRAPH_ID);
        const firstGraphId = graphsMap.keys().next().value;
        const activeId = storedActiveId && graphsMap.has(storedActiveId) ? storedActiveId : firstGraphId;

        if (activeId) {
          const activeGraph = graphsMap.get(activeId);
          if (activeGraph) {
            setActiveGraphId(activeId);
            setNodes(activeGraph.nodes);
            setEdges(activeGraph.edges);
            setNodeIdCounter(activeGraph.nodeIdCounter);
          }
        }
      } catch (error) {
        console.error('Failed to load graphs from localStorage:', error);
        // Create default graph if loading fails
        const defaultGraph = createDefaultGraph();
        const newMap = new Map([[defaultGraph.id, defaultGraph]]);
        setGraphs(newMap);
        setActiveGraphId(defaultGraph.id);
        saveToStorage(newMap);
      }
    } else {
      // Create default graph
      const defaultGraph = createDefaultGraph();
      const newMap = new Map([[defaultGraph.id, defaultGraph]]);
      setGraphs(newMap);
      setActiveGraphId(defaultGraph.id);
      saveToStorage(newMap);
    }
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, String(sidebarOpened));
  }, [sidebarOpened]);

  const addChildNode = useCallback((parentId: string) => {
    const newNode: Node = {
      id: `${nodeIdCounter}`,
      type: 'mikado',
      position: { x: 0, y: 0 }, // Will be positioned by dagre
      data: {
        header: 'New Task',
        description: '',
        status: 'todo',
        onDelete: deleteNode,
        onAddChild: addChildNode,
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

  // Helper to attach callbacks to nodes
  const attachCallbacksToNodes = useCallback((nodesList: Node[]) => {
    return nodesList.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: deleteNode,
        onAddChild: addChildNode,
      },
    }));
  }, [deleteNode, addChildNode]);

  // Attach callbacks to nodes after mount and when callbacks change
  useEffect(() => {
    if (nodes.length > 0) {
      const nodesWithCallbacks = attachCallbacksToNodes(nodes);
      // Only update if callbacks are not already attached
      if (!nodes[0].data.onDelete || !nodes[0].data.onAddChild) {
        setNodes(nodesWithCallbacks);
      }
    }
  }, [attachCallbacksToNodes]);

  const exportGraph = useCallback(async () => {
    if (!activeGraphId) return;

    const graph = graphs.get(activeGraphId);
    if (!graph) return;

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
    const sanitizedName = graph.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const suggestedName = `${sanitizedName}-${new Date().toISOString().split('T')[0]}.json`;

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
        showAlert('Failed to export graph');
      }
    }
  }, [activeGraphId, graphs, nodes, edges, nodeIdCounter, showAlert]);

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

  // Graph operations
  const createNewGraph = useCallback(() => {
    const newGraph = createDefaultGraph(generateGraphName(graphs));
    const newGraphs = new Map(graphs);
    newGraphs.set(newGraph.id, newGraph);
    setGraphs(newGraphs);
    setActiveGraphId(newGraph.id);
    setNodes(attachCallbacksToNodes(newGraph.nodes));
    setEdges(newGraph.edges);
    setNodeIdCounter(newGraph.nodeIdCounter);
    saveToStorage(newGraphs);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GRAPH_ID, newGraph.id);
  }, [graphs, saveToStorage, attachCallbacksToNodes]);

  const switchGraph = useCallback((graphId: string) => {
    // Save current graph state before switching
    if (activeGraphId) {
      const currentGraph = graphs.get(activeGraphId);
      if (currentGraph) {
        currentGraph.nodes = nodes;
        currentGraph.edges = edges;
        currentGraph.nodeIdCounter = nodeIdCounter;
        currentGraph.lastModified = new Date().toISOString();
        const updatedGraphs = new Map(graphs);
        updatedGraphs.set(activeGraphId, currentGraph);
        setGraphs(updatedGraphs);
        saveToStorage(updatedGraphs);
      }
    }

    // Load new graph
    const newGraph = graphs.get(graphId);
    if (newGraph) {
      setNodes(attachCallbacksToNodes(newGraph.nodes));
      setEdges(newGraph.edges);
      setNodeIdCounter(newGraph.nodeIdCounter);
      setActiveGraphId(graphId);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GRAPH_ID, graphId);
    }
  }, [activeGraphId, graphs, nodes, edges, nodeIdCounter, saveToStorage, attachCallbacksToNodes]);

  const deleteGraph = useCallback((graphId: string) => {
    const performDelete = () => {
      const newGraphs = new Map(graphs);
      newGraphs.delete(graphId);

      // If this was the last graph, create a new default one
      if (newGraphs.size === 0) {
        const defaultGraph = createDefaultGraph();
        newGraphs.set(defaultGraph.id, defaultGraph);
        setGraphs(newGraphs);
        setActiveGraphId(defaultGraph.id);
        setNodes(attachCallbacksToNodes(defaultGraph.nodes));
        setEdges(defaultGraph.edges);
        setNodeIdCounter(defaultGraph.nodeIdCounter);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_GRAPH_ID, defaultGraph.id);
        saveToStorage(newGraphs);
        return;
      }

      setGraphs(newGraphs);

      // If deleting active graph, switch to first available
      if (graphId === activeGraphId) {
        const firstGraphId = newGraphs.keys().next().value;
        if (firstGraphId) {
          const firstGraph = newGraphs.get(firstGraphId);
          if (firstGraph) {
            setActiveGraphId(firstGraphId);
            setNodes(attachCallbacksToNodes(firstGraph.nodes));
            setEdges(firstGraph.edges);
            setNodeIdCounter(firstGraph.nodeIdCounter);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_GRAPH_ID, firstGraphId);
          }
        }
      }

      saveToStorage(newGraphs);
    };

    showConfirm(
      'Delete Graph',
      'Are you sure you want to delete this graph? This action cannot be undone.',
      performDelete
    );
  }, [graphs, activeGraphId, saveToStorage, showConfirm, attachCallbacksToNodes]);

  const renameGraph = useCallback((graphId: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      showAlert("Graph name cannot be empty");
      return false;
    }

    const isDuplicate = Array.from(graphs.values())
      .some(g => g.id !== graphId && g.name === trimmedName);

    if (isDuplicate) {
      showAlert("A graph with this name already exists");
      return false;
    }

    const graph = graphs.get(graphId);
    if (graph) {
      graph.name = trimmedName;
      graph.lastModified = new Date().toISOString();
      const newGraphs = new Map(graphs);
      newGraphs.set(graphId, graph);
      setGraphs(newGraphs);
      saveToStorage(newGraphs);
      return true;
    }
    return false;
  }, [graphs, saveToStorage, showAlert]);

  const importGraphFromFile = useCallback(async (file: File | null) => {
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

      const importedGraph: GraphData = {
        id: crypto.randomUUID(),
        name: generateGraphName(graphs),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        nodeIdCounter: data.nodeIdCounter,
        nodes: laidOutNodes,
        edges: laidOutEdges,
      };

      const newGraphs = new Map(graphs);
      newGraphs.set(importedGraph.id, importedGraph);
      setGraphs(newGraphs);
      setActiveGraphId(importedGraph.id);
      setNodes(attachCallbacksToNodes(importedGraph.nodes));
      setEdges(importedGraph.edges);
      setNodeIdCounter(importedGraph.nodeIdCounter);
      saveToStorage(newGraphs);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GRAPH_ID, importedGraph.id);

      console.log('Graph imported successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showAlert(`Import failed: ${message}`);
      console.error('Import error:', error);
    }
  }, [graphs, saveToStorage, showAlert, attachCallbacksToNodes]);

  // Auto-save current graph
  const debouncedSave = useDebouncedCallback(() => {
    if (activeGraphId) {
      const currentGraph = graphs.get(activeGraphId);
      if (currentGraph) {
        currentGraph.nodes = nodes;
        currentGraph.edges = edges;
        currentGraph.nodeIdCounter = nodeIdCounter;
        currentGraph.lastModified = new Date().toISOString();
        const newGraphs = new Map(graphs);
        newGraphs.set(activeGraphId, currentGraph);
        setGraphs(newGraphs);
        saveToStorage(newGraphs);
      }
    }
  }, 500);

  useEffect(() => {
    if (activeGraphId) {
      debouncedSave();
    }
  }, [nodes, edges, nodeIdCounter]);

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

      <Modal
        opened={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={confirmModalConfig?.title || 'Confirm'}
        centered
        zIndex={1000}
      >
        <Stack gap="md">
          <Text>{confirmModalConfig?.message}</Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => {
                confirmModalConfig?.onConfirm();
                setConfirmModalOpen(false);
              }}
            >
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        title="Notice"
        centered
        zIndex={1000}
      >
        <Stack gap="md">
          <Text>{alertModalMessage}</Text>
          <Group justify="flex-end">
            <Button onClick={() => setAlertModalOpen(false)}>
              OK
            </Button>
          </Group>
        </Stack>
      </Modal>

      <AppShell
        navbar={{
          width: 280,
          breakpoint: 'sm',
          collapsed: { mobile: !sidebarOpened, desktop: !sidebarOpened }
        }}
        padding={0}
      >
        <AppShell.Navbar p="md">
          <Stack gap="md">
            <Text size="xl" fw={700}>Graphs</Text>

            <Button
              leftSection={<IconPlus size={16} />}
              fullWidth
              variant="light"
              onClick={createNewGraph}
            >
              New Graph
            </Button>

            <FileButton onChange={importGraphFromFile} accept=".json,application/json">
              {(props) => (
                <Button
                  {...props}
                  leftSection={<IconUpload size={16} />}
                  fullWidth
                  variant="light"
                >
                  Import Graph
                </Button>
              )}
            </FileButton>

            <Divider />

            <ScrollArea.Autosize mah="calc(100vh - 250px)">
              {graphs.size === 0 ? (
                <Stack align="center" gap="md" py="xl">
                  <Text c="dimmed" size="sm">No graphs yet</Text>
                  <Button onClick={createNewGraph}>Create your first graph</Button>
                </Stack>
              ) : (
                <Stack gap="xs">
                  {Array.from(graphs.values()).map((graph) => (
                    <GraphListItem
                      key={graph.id}
                      graph={graph}
                      isActive={graph.id === activeGraphId}
                      onSelect={() => switchGraph(graph.id)}
                      onDelete={() => deleteGraph(graph.id)}
                      onRename={(newName) => renameGraph(graph.id, newName)}
                    />
                  ))}
                </Stack>
              )}
            </ScrollArea.Autosize>
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>
          <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <Group justify="space-between" p="md" style={{
              borderBottom: '1px solid #e9ecef',
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              flexShrink: 0
            }}>
              <ActionIcon
                onClick={() => setSidebarOpened(o => !o)}
                variant="subtle"
                size="lg"
                aria-label="Toggle sidebar"
              >
                {sidebarOpened ? <IconLayoutSidebarLeftCollapse size={20} /> : <IconLayoutSidebarLeftExpand size={20} />}
              </ActionIcon>

              <Group justify="flex-end">
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
            </Group>

            <div style={{ flexGrow: 1, position: 'relative' }}>
              <ReactFlow
                key={activeGraphId}
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
        </AppShell.Main>
      </AppShell>
    </>
  );
}

export default App;
