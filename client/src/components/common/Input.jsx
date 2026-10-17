import React from 'react';

const Input = ({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  containerStyle = {},
  style = {},
  ...props
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...containerStyle }}>
      {label && (
        <label
          style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          style={{
            width: '100%',
            padding: Icon ? '9px 12px 9px 36px' : '9px 12px',
            borderColor: error ? '#ef4444' : 'var(--border-color)',
            ...style,
          }}
          className={className}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
