import { Modal, Stack, Text, Group, Button } from '@mantine/core';

interface DeleteNodeModalProps {
  opened: boolean;
  onClose: () => void;
  isRootNode: boolean;
  descendantCount: number;
  onConfirm: () => void;
}

export const DeleteNodeModal = ({
  opened,
  onClose,
  isRootNode,
  descendantCount,
  onConfirm,
}: DeleteNodeModalProps) => {
  const getTitle = () => {
    if (isRootNode) {
      return 'Delete Root Task';
    }
    return 'Delete Task with Subtasks';
  };

  const getMessage = () => {
    if (isRootNode) {
      return 'This is a root task. Deleting it will remove the entire task branch. Are you sure?';
    }
    return `This task has ${descendantCount} subtask(s). Deleting it will also remove all its subtasks. Are you sure?`;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={getTitle()}
      centered
      zIndex={1000}
    >
      <Stack gap="md">
        <Text>{getMessage()}</Text>
        <Group justify="flex-end" gap="sm">
          <Button
            variant="default"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
