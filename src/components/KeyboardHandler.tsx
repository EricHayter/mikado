import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';

interface KeyboardHandlerProps {
  selectedNodes: string[];
  deleteNode: (id: string) => void;
}

// Component to handle keyboard events with ReactFlow hooks
export function KeyboardHandler({ selectedNodes, deleteNode }: KeyboardHandlerProps) {
  const { setViewport, getViewport } = useReactFlow();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Delete key - delete selected nodes
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodes.length > 0) {
          event.preventDefault();
          selectedNodes.forEach(nodeId => deleteNode(nodeId));
        }
      }

      // Arrow keys - pan the viewport smoothly
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        const panAmount = event.shiftKey ? 100 : 50;
        const viewport = getViewport();

        let newX = viewport.x;
        let newY = viewport.y;

        switch (event.key) {
          case 'ArrowUp':
            newY += panAmount;
            break;
          case 'ArrowDown':
            newY -= panAmount;
            break;
          case 'ArrowLeft':
            newX += panAmount;
            break;
          case 'ArrowRight':
            newX -= panAmount;
            break;
        }

        setViewport({ x: newX, y: newY, zoom: viewport.zoom });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, deleteNode, setViewport, getViewport]);

  return null;
}
