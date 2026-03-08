import { useCallback, useState, useEffect, useRef } from 'react';
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
  Stack,
  AppShell,
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
} from '@tabler/icons-react';
import MikadoNode from './components/MikadoNode';
import GraphListItem from './components/GraphListItem';
import { ExportModal } from './components/modals/ExportModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { AlertModal } from './components/modals/AlertModal';
import type { GraphData } from './types';
import { STORAGE_KEYS, initialNodesRaw, initialEdges } from './constants';
import { getLaidOutElements } from './utils/layout';
import { validateImportData, createDefaultGraph, generateGraphName, createExportData } from './utils/graph';
import './App.css';

const nodeTypes = {
  mikado: MikadoNode,
};

const { nodes: initialNodes, edges: initialEdgesLaidOut} = getLaidOutElements(initialNodesRaw, initialEdges);

function App() {
  const [graphs, setGraphs] = useState<Map<string, GraphData>>(new Map());
  const [activeGraphId, setActiveGraphId] = useState<string | null>(null);
  const [sidebarOpened, setSidebarOpened] = useState<boolean>(true);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesLaidOut);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);

  const isAttachingCallbacks = useRef(false);

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
    setNodeIdCounter((currentCounter) => {
      const newNodeId = `${currentCounter}`;

      setNodes((currentNodes) => {
        setEdges((currentEdges) => {
          const newNode: Node = {
            id: newNodeId,
            type: 'mikado',
            position: { x: 0, y: 0 },
            data: {
              header: 'New Task',
              description: '',
              status: 'todo',
            },
          };

          const newEdge: Edge = {
            id: `e${parentId}-${newNodeId}`,
            source: parentId,
            target: newNodeId,
          };

          const { nodes: laidOutNodes, edges: laidOutEdges } = getLaidOutElements(
            [...currentNodes, newNode],
            [...currentEdges, newEdge]
          );

          setNodes(laidOutNodes);
          setEdges(laidOutEdges);

          return currentEdges;
        });
        return currentNodes;
      });

      return currentCounter + 1;
    });
  }, [setNodes, setEdges, setNodeIdCounter]);

  const deleteNode = useCallback((nodeId: string) => {
    // Find all descendants recursively
    const findDescendants = (id: string, edgesList: Edge[]): Set<string> => {
      const descendants = new Set<string>();
      const children = edgesList.filter(e => e.source === id).map(e => e.target);

      children.forEach(childId => {
        descendants.add(childId);
        const childDescendants = findDescendants(childId, edgesList);
        childDescendants.forEach(descId => descendants.add(descId));
      });

      return descendants;
    };

    setEdges((eds) => {
      const descendants = findDescendants(nodeId, eds);
      const allNodesToDelete = new Set([nodeId, ...descendants]);

      // Also update nodes to remove the node and all its descendants
      setNodes((nds) => nds.filter(n => !allNodesToDelete.has(n.id)));

      // Delete all edges connected to the node or any of its descendants
      return eds.filter(e => !allNodesToDelete.has(e.source) && !allNodesToDelete.has(e.target));
    });
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
    if (nodes.length > 0 && !isAttachingCallbacks.current) {
      // Check if any node is missing callbacks
      const needsCallbacks = nodes.some(node => !node.data.onDelete || !node.data.onAddChild);
      if (needsCallbacks) {
        isAttachingCallbacks.current = true;
        const nodesWithCallbacks = attachCallbacksToNodes(nodes);
        setNodes(nodesWithCallbacks);
        // Reset the flag after a short delay to allow the update to complete
        setTimeout(() => {
          isAttachingCallbacks.current = false;
        }, 0);
      }
    }
  }, [nodes, attachCallbacksToNodes, setNodes]);

  const exportGraph = useCallback(async () => {
    if (!activeGraphId) return;

    const graph = graphs.get(activeGraphId);
    if (!graph) return;

    const exportData = createExportData(nodes, edges, nodeIdCounter);
    const jsonString = JSON.stringify(exportData, null, 2);
    const sanitizedName = graph.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const suggestedName = `${sanitizedName}-${new Date().toISOString().split('T')[0]}.json`;

    try {
      // Use File System Access API if available (Chrome, Edge)
      if (typeof (window as any).showSaveFilePicker === 'function') {
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
      <ExportModal
        opened={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        filename={exportFilename}
        onFilenameChange={setExportFilename}
        onDownload={handleDownloadFromModal}
      />

      <ConfirmModal
        opened={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={confirmModalConfig?.title || 'Confirm'}
        message={confirmModalConfig?.message || ''}
        onConfirm={confirmModalConfig?.onConfirm || (() => {})}
      />

      <AlertModal
        opened={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        message={alertModalMessage}
      />

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
