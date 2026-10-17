import React, { useState, useRef, useEffect } from 'react';

const Dropdown = ({
  trigger,
  children,
  align = 'right',
  width = 'auto',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      style={{ position: 'relative', display: 'inline-block' }}
      className={className}
    >
      <div onClick={() => setIsOpen((prev) => !prev)} style={{ cursor: 'pointer' }}>
        {typeof trigger === 'function' ? trigger({ isOpen }) : trigger}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align === 'right' ? 'right' : 'left']: 0,
            zIndex: 100,
            width,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-dropdown)',
            padding: '6px',
            minWidth: '160px',
            animation: 'fadeIn 0.15s ease-out forwards',
          }}
          onClick={(e) => {
            // If clicking interactive elements, close or let child handle
            if (e.target.dataset.closeDropdown) {
              setIsOpen(false);
            }
          }}
        >
          {typeof children === 'function' ? children({ close: () => setIsOpen(false) }) : children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
