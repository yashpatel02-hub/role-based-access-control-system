import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  style = {},
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: 'var(--primary-light)', color: 'var(--primary)' };
      case 'success':
        return { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' };
      case 'warning':
        return { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' };
      case 'danger':
        return { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' };
      case 'info':
        return { backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' };
      default:
        return { backgroundColor: 'var(--bg-active)', color: 'var(--text-secondary)' };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '2px 8px', fontSize: '0.6875rem' };
      case 'lg':
        return { padding: '6px 14px', fontSize: '0.875rem' };
      default:
        return { padding: '3px 10px', fontSize: '0.75rem' };
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 500,
        borderRadius: 'var(--radius-full)',
        whiteSpace: 'nowrap',
        ...getSizeStyles(),
        ...getVariantStyles(),
        ...style,
      }}
      className={`badge ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
