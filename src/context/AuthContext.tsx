import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, VirtualAccount } from '../types';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/api';
import { signInWithGooglePopup, signOutGoogle } from '../services/googleAuth';

interface AuthContextType {
  user: User | null;
  account: VirtualAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (params?: { credential?: string; email?: string; name?: string; avatar?: string }) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccount: () => Promise<void>;
  setAccount: (account: VirtualAccount) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<VirtualAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccount = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setAccount(null);
        return;
      }
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
        setAccount(res.account);
      } else {
        clearAuthToken();
        setUser(null);
        setAccount(null);
      }
    } catch {
      clearAuthToken();
      setUser(null);
      setAccount(null);
    }
  }, []);

  // Listen to background token updates
  useEffect(() => {
    const handleAuthUpdated = (e: any) => {
      if (e.detail) {
        if (e.detail.user) setUser(e.detail.user);
        if (e.detail.account) setAccount(e.detail.account);
      }
    };
    window.addEventListener('tradeveda:auth_updated', handleAuthUpdated);
    return () => window.removeEventListener('tradeveda:auth_updated', handleAuthUpdated);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        await refreshAccount();
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshAccount]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.success) {
      setAuthToken(res.token);
      setUser(res.user);
      setAccount(res.account);
    }
  };

  const loginWithGoogle = async (params?: { credential?: string; email?: string; name?: string; avatar?: string }) => {
    let payload = params;
    // If no direct email or credential passed, launch real Google popup!
    if (!payload?.email && !payload?.credential) {
      const googleUser = await signInWithGooglePopup();
      payload = {
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.avatar,
        credential: googleUser.idToken,
      };
    }
    const res = await api.googleLogin(payload);
    if (res.success) {
      setAuthToken(res.token);
      setUser(res.user);
      setAccount(res.account);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register(name, email, password);
    if (res.success) {
      setAuthToken(res.token);
      setUser(res.user);
      setAccount(res.account);
    }
  };

  const logout = () => {
    clearAuthToken();
    signOutGoogle();
    setUser(null);
    setAccount(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshAccount,
        setAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
