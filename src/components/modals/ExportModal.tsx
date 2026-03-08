import { Modal, TextInput, Stack, Group, Button } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';

interface ExportModalProps {
  opened: boolean;
  onClose: () => void;
  filename: string;
  onFilenameChange: (filename: string) => void;
  onDownload: () => void;
}

export const ExportModal = ({
  opened,
  onClose,
  filename,
  onFilenameChange,
  onDownload,
}: ExportModalProps) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Export Project"
      centered
      zIndex={1000}
    >
      <Stack gap="md">
        <TextInput
          label="Filename"
          placeholder="Enter filename"
          value={filename}
          onChange={(e) => onFilenameChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onDownload();
            }
          }}
        />
        <Group justify="flex-end" gap="sm">
          <Button
            variant="default"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={onDownload}
          >
            Download
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
