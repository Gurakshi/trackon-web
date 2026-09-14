import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('TRACKON_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initUser() {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.success) {
            setUser(res.data);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session expired or invalid, clearing:', err);
          logout();
        }
      } else {
        // Automatically sign in as default Track Inspector for seamless preview if desired,
        // or let user view login screen. Let's auto-load Track Inspector if first time visiting!
        quickLoginAs('IR-TI-1042', '849201').catch(() => {});
      }
      setLoading(false);
    }
    initUser();
  }, []);

  const loginWithOtp = async (employeeId, otp) => {
    const res = await authApi.verifyOtp(employeeId, otp);
    if (res.success && res.data.token) {
      localStorage.setItem('TRACKON_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.error || 'Authentication failed');
  };

  const quickLoginAs = async (employeeId, otp = '849201') => {
    try {
      await authApi.requestOtp(employeeId, null);
      const res = await authApi.verifyOtp(employeeId, otp);
      if (res.success && res.data.token) {
        localStorage.setItem('TRACKON_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (e) {
      console.error('Quick login failed:', e);
    }
  };

  const logout = () => {
    localStorage.removeItem('TRACKON_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        role: user?.role || 'Guest',
        loginWithOtp,
        quickLoginAs,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
