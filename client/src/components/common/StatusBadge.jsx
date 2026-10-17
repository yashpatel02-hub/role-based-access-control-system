import React from 'react';
import Badge from './Badge';

const StatusBadge = ({ status, size = 'md' }) => {
  const getVariant = (s) => {
    switch (s?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'archived':
      case 'inactive':
        return 'danger';
      case 'expiring':
      case 'expiring soon':
        return 'warning';
      case 'expired':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getLabel = (s) => {
    if (!s) return 'Unknown';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <Badge variant={getVariant(status)} size={size}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          marginRight: '6px',
          display: 'inline-block',
        }}
      />
      {getLabel(status)}
    </Badge>
  );
};

export default StatusBadge;
