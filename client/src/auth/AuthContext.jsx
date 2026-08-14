import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.getMe();
      setUser(res.data?.user || res.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser();
  }, [token, refreshUser]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const newToken = res.data?.token || res.token;
    const newUser = res.data?.user || res.user;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return res;
  };

  const register = async (payload) => {
    const res = await authApi.register(payload);
    const newToken = res.data?.token || res.token;
    const newUser = res.data?.user || res.user;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return res;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!token && !!user,
      role: user?.role || null,
      isCitizen: user?.role === 'citizen',
      isOfficer: user?.role === 'officer',
      isAdmin: user?.role === 'admin',
    }),
    [user, token, loading, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
