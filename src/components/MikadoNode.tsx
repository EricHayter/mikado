import { memo, useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ActionIcon, TextInput, Textarea, Badge, Paper, Group, useMantineTheme } from '@mantine/core';
import { IconX, IconPlus } from '@tabler/icons-react';

export type MikadoNodeData = {
  header: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  onDelete?: (id: string) => void;
  onAddChild?: (parentId: string) => void;
};

type MikadoNodeProps = {
  data: MikadoNodeData;
  id: string;
};

const MikadoNode = ({ data, id }: MikadoNodeProps) => {
  const theme = useMantineTheme();
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
        return 'gray';
      case 'in-progress':
        return 'yellow';
      case 'done':
        return 'green';
      default:
        return 'gray';
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

  const getBackgroundColor = () => {
    switch (status) {
      case 'todo':
        return theme.white;
      case 'in-progress':
        return theme.colors.yellow[0];
      case 'done':
        return theme.colors.green[0];
      default:
        return theme.white;
    }
  };

  return (
    <Paper
      shadow="sm"
      radius="md"
      style={{
        backgroundColor: getBackgroundColor(),
        width: '280px',
        position: 'relative',
        border: '1px solid #e9ecef',
        padding: '16px 16px 12px 16px',
      }}
      className="mikado-node-paper"
    >
      {/* Hidden handles for edge connections */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      {data.onDelete && (
        <ActionIcon
          color="red"
          variant="filled"
          size="sm"
          radius="sm"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
          className="node-delete-btn-mantine"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete?.(id);
          }}
          title="Delete task"
          aria-label="Delete task"
        >
          <IconX size={14} stroke={2.5} />
        </ActionIcon>
      )}

      <div>
        {isEditingHeader ? (
          <TextInput
            value={header}
            onChange={(e) => setHeader(e.currentTarget.value)}
            onBlur={handleHeaderBlur}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            size="md"
            styles={{
              input: {
                fontWeight: 600,
              },
            }}
          />
        ) : (
          <div
            onDoubleClick={handleHeaderDoubleClick}
            style={{
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'text',
              minHeight: '24px',
              padding: '4px',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {header}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 8 }}>
        {isEditingDescription ? (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            onBlur={handleDescriptionBlur}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.blur();
              }
            }}
            placeholder="Add description..."
            minRows={2}
            autosize
          />
        ) : description ? (
          <div
            onDoubleClick={handleDescriptionDoubleClick}
            style={{
              fontSize: '14px',
              color: theme.colors.gray[7],
              cursor: 'text',
              minHeight: '20px',
              whiteSpace: 'pre-wrap',
              padding: '4px',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {description}
          </div>
        ) : (
          <div
            onDoubleClick={handleDescriptionDoubleClick}
            style={{
              fontSize: '14px',
              color: theme.colors.gray[5],
              cursor: 'text',
              minHeight: '20px',
              fontStyle: 'italic',
              padding: '4px',
            }}
          >
            Add description...
          </div>
        )}
      </div>

      <Group>
        <Badge
          color={getStatusColor()}
          variant="filled"
          size="lg"
          style={{ cursor: 'pointer' }}
          onClick={cycleStatus}
        >
          {getStatusLabel()}
        </Badge>
      </Group>

      {data.onAddChild && (
        <ActionIcon
          color="blue"
          variant="filled"
          size="sm"
          radius="sm"
          style={{
            position: 'absolute',
            bottom: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 0,
            transition: 'opacity 0.2s',
            zIndex: 10,
          }}
          className="node-add-child-btn"
          onClick={(e) => {
            e.stopPropagation();
            data.onAddChild?.(id);
          }}
          title="Add subtask"
          aria-label="Add subtask"
        >
          <IconPlus size={14} stroke={2.5} />
        </ActionIcon>
      )}
    </Paper>
  );
};

export default memo(MikadoNode);
