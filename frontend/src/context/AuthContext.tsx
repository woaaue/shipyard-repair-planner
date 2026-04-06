import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockUsers } from '../mock-data/mockUsers';

export interface User {
  email: string;
  fullName: string;
  role: 'admin' | 'dispatcher' | 'operator' | 'client' | 'master' | 'worker';
  dock?: string;
  shipId?: number;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const foundUser = mockUsers.find(u =>
      u.email === email && u.password === password
    );

    if (foundUser) {
      const authUser: User = {
        email: foundUser.email,
        fullName: foundUser.fullName,
        role: foundUser.role,
        dock: 'dock' in foundUser ? foundUser.dock : undefined,
        shipId: 'shipId' in foundUser ? foundUser.shipId : undefined,
        avatar: foundUser.avatar,
      };
      setUser(authUser);
      localStorage.setItem('user', JSON.stringify(authUser));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}
