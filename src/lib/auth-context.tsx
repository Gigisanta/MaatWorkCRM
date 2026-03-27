'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AuthUser } from './auth-helpers';

interface SessionData {
  expiresAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  session: SessionData | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  mutateUser: (user: AuthUser | null) => void;
  linkedProviders?: string[];
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: string;
  managerId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SYNC_KEY = 'maatwork_auth_sync';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await response.json();

      // NextAuth returns { user: {...}, expires: "..." } format
      // Also handle our custom format { authenticated: true, user: {...}, session: {...} }
      if ((data.authenticated && data.user) || (data.user && data.expires)) {
        // Fetch additional user data (organization, linkedProviders) if using NextAuth session
        let userData = data.user;
        if (data.user && !data.organizationId) {
          try {
            const profileRes = await fetch('/api/auth/user-profile', { credentials: 'include' });
            const profileData = await profileRes.json();
            if (profileData.user) {
              userData = { ...data.user, ...profileData.user };
            }
          } catch {
            // Ignore profile fetch errors
          }
        }
        setUser(userData);
        setSession(data.session || (data.expires ? { expiresAt: data.expires } : null));
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setUser(null);
      setSession(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  // Initial session fetch
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await fetchSession();
      setIsLoading(false);
    };
    
    initAuth();
  }, [fetchSession]);

  // Auto-refresh session every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshSession();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [user, refreshSession]);

  // Multi-tab sync via localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_SYNC_KEY) {
        fetchSession();
      }
    };

    const handleFocus = () => {
      fetchSession();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchSession]);

  const notifyOtherTabs = useCallback(() => {
    localStorage.setItem(AUTH_SYNC_KEY, Date.now().toString());
    localStorage.removeItem(AUTH_SYNC_KEY);
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password, rememberMe }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      setUser(data.user);
      toast.success('Inicio de sesión exitoso');
      notifyOtherTabs();
      
      // Redirect to home
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      toast.error(message);
      throw error;
    }
  }, [router, notifyOtherTabs]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear cuenta');
      }

      toast.success('Cuenta creada. Pendiente de aprobación.');
      notifyOtherTabs();
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear cuenta';
      toast.error(message);
      throw error;
    }
  }, [router, notifyOtherTabs]);

  const logout = useCallback(async () => {
    try {
      // Clear custom session if exists
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore errors from custom logout
    }
    try {
      // Clear NextAuth session (handles Google OAuth too)
      await signOut({ redirect: false });
    } catch {
      // Ignore if no NextAuth session
    }
    setUser(null);
    setSession(null);
    toast.success('Sesión cerrada');
    notifyOtherTabs();
    router.push('/login');
  }, [router, notifyOtherTabs]);

  const mutateUser = useCallback((newUser: AuthUser | null) => {
    setUser(newUser);
    if (!newUser) {
      setSession(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    session,
    login,
    register,
    logout,
    refreshSession,
    mutateUser,
  }), [user, isLoading, session, login, register, logout, refreshSession, mutateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
