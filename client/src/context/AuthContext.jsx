import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch current session user
  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authService.getMe();
      if (res && res.user) {
        setUser(res.user);
        setRoles(res.user.roles || []);
        setPermissions(res.user.permissions || []);
        setIsSuperAdmin(Boolean(res.user.isSuperAdmin));
      } else {
        setUser(null);
        setRoles([]);
        setPermissions([]);
        setIsSuperAdmin(false);
      }
    } catch (err) {
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res && res.user) {
      setUser(res.user);
      setRoles(res.user.roles || []);
      setPermissions(res.user.permissions || []);
      setIsSuperAdmin(Boolean(res.user.isSuperAdmin));
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res && res.user) {
      setUser(res.user);
      setRoles(res.user.roles || []);
      setPermissions(res.user.permissions || []);
      setIsSuperAdmin(Boolean(res.user.isSuperAdmin));
    }
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setIsSuperAdmin(false);
    }
  };

  const updateUserProfile = async (profileData) => {
    const res = await authService.updateProfile(profileData);
    if (res && res.user) {
      setUser((prev) => ({ ...prev, ...res.user }));
    }
    return res;
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const isAuthenticated = () => Boolean(user);

  const hasRole = (roleName) => {
    if (isSuperAdmin) return true;
    return roles.includes(roleName);
  };

  const hasPermission = (permissionName) => {
    if (isSuperAdmin) return true;
    return permissions.includes(permissionName);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        isSuperAdmin,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        refreshUser,
        isAuthenticated,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
