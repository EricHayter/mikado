import { Modal, Title, Text, Stack, Table, Divider, Badge, Anchor } from '@mantine/core';

interface HelpModalProps {
  opened: boolean;
  onClose: () => void;
}

export function HelpModal({ opened, onClose }: HelpModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Help & Information"
      size="lg"
      centered
    >
      <Stack gap="md">
        {/* What is the Mikado Method */}
        <div>
          <Title order={4}>What is the Mikado Method?</Title>
          <Text size="sm" mt="xs">
            The Mikado Method is a friendly technique for tackling large, complex changes by
            breaking them into smaller, manageable tasks. Perfect for refactoring legacy code,
            planning major features, or any project where you're not quite sure of the full scope yet!
          </Text>
          <Stack gap="xs" mt="md">
            <Text size="sm">
              <strong>1.</strong> Start with your main goal as the root task (e.g., "Migrate to new API")
            </Text>
            <Text size="sm">
              <strong>2.</strong> Set a short timer (15-30 minutes) and try to complete the task
            </Text>
            <Text size="sm">
              <strong>3.</strong> Did you finish? Great! Mark it done and move to the next task. Hit a blocker? Continue to step 4
            </Text>
            <Text size="sm">
              <strong>4.</strong> Revert your changes, then add subtasks for what you'd need to complete first
            </Text>
            <Text size="sm">
              <strong>5.</strong> Pick a subtask and return to step 2, working from the smallest tasks back to your goal!
            </Text>
          </Stack>
          <Text size="xs" c="dimmed" fs="italic" mt="sm">
            Fun fact: Named after Mikado pickup sticks — pull the wrong stick and everything collapses!
          </Text>
          <Text size="sm" mt="md">
            Want to learn more?{' '}
            <Anchor
              href="https://understandlegacycode.com/blog/a-process-to-do-safe-changes-in-a-complex-codebase/"
              target="_blank"
              rel="noopener noreferrer"
            >
              This excellent guide
            </Anchor>
            {' '}explains the Mikado Method in depth and shows how to use it for refactoring.
            It was the inspiration behind this app!
          </Text>
        </div>

        <Divider />

        {/* Keyboard Controls */}
        <div>
          <Title order={4}>Keyboard Controls</Title>
          <Table mt="xs" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Key</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td><Badge variant="light">Delete</Badge> / <Badge variant="light">Backspace</Badge></Table.Td>
                <Table.Td>Delete selected task(s)</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Badge variant="light">↑</Badge> <Badge variant="light">↓</Badge> <Badge variant="light">←</Badge> <Badge variant="light">→</Badge></Table.Td>
                <Table.Td>Pan the canvas (50px)</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Badge variant="light">Shift</Badge> + <Badge variant="light">Arrows</Badge></Table.Td>
                <Table.Td>Pan faster (100px)</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </div>

        <Divider />

        {/* Mouse Controls */}
        <div>
          <Title order={4}>Mouse Controls</Title>
          <Table mt="xs" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Action</Table.Th>
                <Table.Th>Result</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>Scroll wheel up/down</Table.Td>
                <Table.Td>Zoom in/out</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Left-click + drag</Table.Td>
                <Table.Td>Pan the canvas</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Click on task</Table.Td>
                <Table.Td>Select task</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Double-click text</Table.Td>
                <Table.Td>Edit task title/description</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Hover over task</Table.Td>
                <Table.Td>Show add/delete buttons</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </div>

        <Divider />

        {/* Task Actions */}
        <div>
          <Title order={4}>Working with Tasks</Title>
          <Stack gap="xs" mt="xs">
            <Text size="sm" component="div">
              <strong>Add subtask:</strong> Hover over a task and click the blue <Badge size="sm">+</Badge> button
            </Text>
            <Text size="sm" component="div">
              <strong>Delete task:</strong> Select a task and press Delete/Backspace, or hover and click the red <Badge size="sm" color="red">×</Badge> button
            </Text>
            <Text size="sm" component="div">
              <strong>Change status:</strong> Click the status badge to cycle through TODO → In Progress → Done
            </Text>
            <Text size="sm" component="div">
              <strong>Edit content:</strong> Double-click the title or description to edit
            </Text>
          </Stack>
        </div>
      </Stack>
    </Modal>
  );
}
