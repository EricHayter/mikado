import { Modal, Stack, Text, Group, Button } from '@mantine/core';

interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
}

export const ConfirmModal = ({
  opened,
  onClose,
  title,
  message,
  onConfirm,
}: ConfirmModalProps) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      zIndex={1000}
    >
      <Stack gap="md">
        <Text>{message}</Text>
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
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
