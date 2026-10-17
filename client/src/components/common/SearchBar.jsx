import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  style = {},
  className = '',
}) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: '320px',
        ...style,
      }}
      className={`search-bar ${className}`}
    >
      <Search
        size={16}
        style={{
          position: 'absolute',
          left: '12px',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 32px 8px 36px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '10px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
