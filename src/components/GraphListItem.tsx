import { useState } from 'react';
import { NavLink, ActionIcon, TextInput } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';

interface GraphListItemProps {
  graph: {
    id: string;
    name: string;
    lastModified: string;
  };
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newName: string) => boolean;
}

export default function GraphListItem({
  graph,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: GraphListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(graph.name);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditName(graph.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const success = onRename(editName);
      if (success) {
        setIsEditing(false);
      } else {
        setEditName(graph.name);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(graph.name);
    }
  };

  const handleBlur = () => {
    const success = onRename(editName);
    if (success) {
      setIsEditing(false);
    } else {
      setEditName(graph.name);
      setIsEditing(false);
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  if (isEditing) {
    return (
      <TextInput
        value={editName}
        onChange={(e) => setEditName(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        size="sm"
        autoFocus
        styles={{
          input: {
            fontFamily: 'inherit',
          }
        }}
      />
    );
  }

  return (
    <NavLink
      active={isActive}
      label={graph.name}
      description={formatTimestamp(graph.lastModified)}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      rightSection={
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          size="sm"
        >
          <IconTrash size={14} />
        </ActionIcon>
      }
      styles={{
        root: {
          cursor: 'pointer',
        },
        label: {
          fontFamily: 'inherit',
          fontWeight: isActive ? 600 : 400,
        }
      }}
    />
  );
}
