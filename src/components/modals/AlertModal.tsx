import { Modal, Stack, Text, Group, Button } from '@mantine/core';

interface AlertModalProps {
  opened: boolean;
  onClose: () => void;
  message: string;
}

export const AlertModal = ({
  opened,
  onClose,
  message,
}: AlertModalProps) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Notice"
      centered
      zIndex={1000}
    >
      <Stack gap="md">
        <Text>{message}</Text>
        <Group justify="flex-end">
          <Button onClick={onClose}>
            OK
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
