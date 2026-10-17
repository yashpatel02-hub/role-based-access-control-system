import React, { useState } from 'react';

const Avatar = ({
  src,
  name = '',
  size = 'md',
  className = '',
  style = {},
}) => {
  const [imageError, setImageError] = useState(false);

  const getDimensions = () => {
    switch (size) {
      case 'xs':
        return { width: '26px', height: '26px', fontSize: '0.6875rem' };
      case 'sm':
        return { width: '32px', height: '32px', fontSize: '0.75rem' };
      case 'lg':
        return { width: '56px', height: '56px', fontSize: '1.25rem' };
      case 'xl':
        return { width: '76px', height: '76px', fontSize: '1.75rem' };
      default:
        return { width: '40px', height: '40px', fontSize: '0.875rem' };
    }
  };

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  // Generate deterministic pleasant background color for initials
  const getColorFromName = (str) => {
    const colors = [
      { bg: '#ede9fe', text: '#6c5ce7' }, // Lavender/Purple
      { bg: '#e0f2fe', text: '#0284c7' }, // Sky Blue
      { bg: '#dcfce7', text: '#16a34a' }, // Emerald
      { bg: '#fef3c7', text: '#d97706' }, // Amber
      { bg: '#fee2e2', text: '#dc2626' }, // Rose
      { bg: '#f3e8ff', text: '#9333ea' }, // Violet
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const dimensions = getDimensions();
  const colorTheme = getColorFromName(name || 'User');

  // Handle server static upload path
  const fullSrc = src
    ? src.startsWith('http')
      ? src
      : `http://localhost:5000${src}`
    : null;

  return (
    <div
      style={{
        ...dimensions,
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colorTheme.bg,
        color: colorTheme.text,
        fontWeight: 600,
        userSelect: 'none',
        flexShrink: 0,
        border: '1px solid rgba(0, 0, 0, 0.05)',
        ...style,
      }}
      className={`avatar ${className}`}
    >
      {fullSrc && !imageError ? (
        <img
          src={fullSrc}
          alt={name}
          onError={() => setImageError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export default Avatar;
