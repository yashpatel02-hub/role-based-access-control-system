import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 28, message = 'Loading...', fullPage = false }) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '32px',
        color: 'var(--text-secondary)',
      }}
    >
      <Loader2
        size={size}
        style={{
          color: 'var(--primary)',
          animation: 'spin 1s linear infinite',
        }}
      />
      {message && <span style={{ fontSize: '0.875rem' }}>{message}</span>}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
