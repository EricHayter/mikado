import { memo, useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';

export type MikadoNodeData = {
  header: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
};

type MikadoNodeProps = {
  data: MikadoNodeData;
  id: string;
};

const MikadoNode = ({ data, id }: MikadoNodeProps) => {
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [header, setHeader] = useState(data.header);
  const [description, setDescription] = useState(data.description);
  const [status, setStatus] = useState(data.status);

  const handleHeaderDoubleClick = useCallback(() => {
    setIsEditingHeader(true);
  }, []);

  const handleDescriptionDoubleClick = useCallback(() => {
    setIsEditingDescription(true);
  }, []);

  const handleHeaderBlur = useCallback(() => {
    setIsEditingHeader(false);
    data.header = header;
  }, [header, data]);

  const handleDescriptionBlur = useCallback(() => {
    setIsEditingDescription(false);
    data.description = description;
  }, [description, data]);

  const cycleStatus = useCallback(() => {
    const statusCycle: MikadoNodeData['status'][] = ['todo', 'in-progress', 'done'];
    const currentIndex = statusCycle.indexOf(status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    setStatus(nextStatus);
    data.status = nextStatus;
  }, [status, data]);

  const getStatusColor = () => {
    switch (status) {
      case 'todo':
        return '#ffffff'; // white
      case 'in-progress':
        return '#fef3c7'; // yellow-100
      case 'done':
        return '#d1fae5'; // green-100
      default:
        return '#ffffff';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return 'To Do';
    }
  };

  return (
    <div
      className="mikado-node"
      style={{
        backgroundColor: getStatusColor(),
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ marginBottom: '12px' }}>
        {isEditingHeader ? (
          <input
            type="text"
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            onBlur={handleHeaderBlur}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            style={{ color: '#111827' }}
          />
        ) : (
          <div
            onDoubleClick={handleHeaderDoubleClick}
            style={{
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'text',
              minHeight: '24px',
              color: '#111827',
            }}
          >
            {header}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '12px' }}>
        {isEditingDescription ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.blur();
              }
            }}
            style={{ color: '#111827' }}
            placeholder="Add description..."
          />
        ) : description ? (
          <div
            onDoubleClick={handleDescriptionDoubleClick}
            style={{
              fontSize: '14px',
              color: '#4b5563',
              cursor: 'text',
              minHeight: '20px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {description}
          </div>
        ) : (
          <div
            onDoubleClick={handleDescriptionDoubleClick}
            style={{
              fontSize: '14px',
              color: '#9ca3af',
              cursor: 'text',
              minHeight: '20px',
              fontStyle: 'italic',
            }}
          >
            Add description...
          </div>
        )}
      </div>

      <div>
        <button onClick={cycleStatus} className="status-btn">
          {getStatusLabel()}
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(MikadoNode);
