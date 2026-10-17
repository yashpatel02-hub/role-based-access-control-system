import React from 'react';
import Badge from './Badge';

const RoleBadge = ({ role, size = 'md' }) => {
  const roleName = typeof role === 'object' && role ? role.name : role;

  const getVariant = (name) => {
    switch (name) {
      case 'Super Admin':
        return 'primary';
      case 'Admin':
        return 'info';
      case 'Manager':
        return 'warning';
      case 'Developer':
        return 'success';
      case 'Viewer':
        return 'default';
      default:
        return 'primary';
    }
  };

  return (
    <Badge variant={getVariant(roleName)} size={size}>
      {roleName || 'No Role'}
    </Badge>
  );
};

export default RoleBadge;
