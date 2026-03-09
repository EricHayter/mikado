import { useState, useCallback } from 'react';

export interface ConfirmModalConfig {
  title: string;
  message: string;
  onConfirm: () => void;
}

export interface DeleteNodeConfig {
  isRootNode: boolean;
  descendantCount: number;
  onConfirm: () => void;
}

export function useModals() {
  // Export modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState('');
  const [pendingExportData, setPendingExportData] = useState<string | null>(null);

  // Confirm modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<ConfirmModalConfig>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Alert modal
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');

  // Delete node modal
  const [deleteNodeModalOpen, setDeleteNodeModalOpen] = useState(false);
  const [deleteNodeConfig, setDeleteNodeConfig] = useState<DeleteNodeConfig | null>(null);

  // Help modal
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Helper functions
  const showAlert = useCallback((message: string) => {
    setAlertModalMessage(message);
    setAlertModalOpen(true);
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmModalConfig({ title, message, onConfirm });
    setConfirmModalOpen(true);
  }, []);

  const showExportModal = useCallback((filename: string, data: string) => {
    setExportFilename(filename);
    setPendingExportData(data);
    setExportModalOpen(true);
  }, []);

  const showDeleteNodeModal = useCallback((config: DeleteNodeConfig) => {
    setDeleteNodeConfig(config);
    setDeleteNodeModalOpen(true);
  }, []);

  return {
    // Export modal
    exportModalOpen,
    setExportModalOpen,
    exportFilename,
    setExportFilename,
    pendingExportData,
    setPendingExportData,
    showExportModal,

    // Confirm modal
    confirmModalOpen,
    setConfirmModalOpen,
    confirmModalConfig,
    showConfirm,

    // Alert modal
    alertModalOpen,
    setAlertModalOpen,
    alertModalMessage,
    showAlert,

    // Delete node modal
    deleteNodeModalOpen,
    setDeleteNodeModalOpen,
    deleteNodeConfig,
    showDeleteNodeModal,

    // Help modal
    helpModalOpen,
    setHelpModalOpen,
  };
}
