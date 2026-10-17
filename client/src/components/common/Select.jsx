import React from 'react';

const Select = ({
  label,
  error,
  options = [],
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
      <select
        style={{
          width: '100%',
          padding: '9px 12px',
          borderColor: error ? '#ef4444' : 'var(--border-color)',
          cursor: 'pointer',
          ...style,
        }}
        className={className}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;
