import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('@taskflow:user');
    const storedToken = localStorage.getItem('@taskflow:token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    const { user: userData, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('@taskflow:token', accessToken);
    localStorage.setItem('@taskflow:refreshToken', refreshToken);
    localStorage.setItem('@taskflow:user', JSON.stringify(userData));

    setUser(userData);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const response = await authService.register({ name, email, password });
    const { user: userData, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('@taskflow:token', accessToken);
    localStorage.setItem('@taskflow:refreshToken', refreshToken);
    localStorage.setItem('@taskflow:user', JSON.stringify(userData));

    setUser(userData);
  };

  const signOut = async () => {
    const refreshToken = localStorage.getItem('@taskflow:refreshToken');
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // Ignora erro no logout
      }
    }

    localStorage.removeItem('@taskflow:token');
    localStorage.removeItem('@taskflow:refreshToken');
    localStorage.removeItem('@taskflow:user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
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