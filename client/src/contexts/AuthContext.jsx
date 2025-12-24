import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await api.get('/auth/me');
        const currentUser = response.data?.user || response.data;
        setUser(currentUser || null);
      } catch {
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    loadCurrentUser();
  }, []);

  const login = async (userData) => {
    try {
      const response = await api.get('/auth/me');
      const currentUser = response.data?.user || response.data;
      setUser(currentUser || userData || null);
    } catch {
      setUser(userData || null);
    }
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
