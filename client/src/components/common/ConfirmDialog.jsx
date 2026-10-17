import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="460px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            padding: '10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: variant === 'danger' ? 'rgba(239, 68, 68, 0.12)' : 'var(--primary-light)',
            color: variant === 'danger' ? '#ef4444' : 'var(--primary)',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={22} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
