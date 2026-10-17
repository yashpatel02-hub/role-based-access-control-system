import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  rightIcon: RightIcon,
  className = '',
  style = {},
  onClick,
  type = 'button',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          border: '1px solid transparent',
          boxShadow: '0 2px 4px rgba(108, 92, 231, 0.25)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        };
      case 'subtle':
        return {
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          border: '1px solid transparent',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid transparent',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '6px 12px', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)' };
      case 'lg':
        return { padding: '12px 24px', fontSize: '1rem', borderRadius: 'var(--radius-md)' };
      default:
        return { padding: '9px 18px', fontSize: '0.875rem', borderRadius: 'var(--radius-md)' };
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all var(--transition-fast)',
        ...getSizeStyles(),
        ...getVariantStyles(),
        ...style,
      }}
      className={`btn ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
      {!loading && RightIcon && <RightIcon size={16} />}
    </button>
  );
};

export default Button;
