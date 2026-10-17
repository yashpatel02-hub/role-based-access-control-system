import React from 'react';
import Button from './Button';
import { FolderOpen } from 'lucide-react';

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no items matching your criteria at this moment.',
  actionLabel,
  onAction,
  actionIcon,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon size={28} />
      </div>
      <h4
        style={{
          fontSize: '1.0625rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          maxWidth: '380px',
          lineHeight: 1.5,
          marginBottom: actionLabel ? '20px' : 0,
        }}
      >
        {description}
      </p>
      {actionLabel && (
        <Button onClick={onAction} icon={actionIcon} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
