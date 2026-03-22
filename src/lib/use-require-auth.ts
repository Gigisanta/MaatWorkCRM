'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './auth-context';
import type { AuthUser } from './auth-helpers';
import { hasPermission, type Permission } from './permissions';

interface UseRequireAuthOptions {
  requiredRole?: string[];
  redirectTo?: string;
  redirectWithParams?: boolean;
}

interface UseRequireAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}): UseRequireAuthReturn {
  const { 
    requiredRole = [], 
    redirectTo = '/login',
    redirectWithParams = true 
  } = options;
  
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (!isAuthenticated || !user) {
      const currentPath = window.location.pathname;
      const redirectUrl = redirectWithParams 
        ? `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        : redirectTo;
      router.push(redirectUrl);
      return;
    }

    // Check role requirement
    if (requiredRole.length > 0 && !requiredRole.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
  }, [user, isLoading, isAuthenticated, requiredRole, redirectTo, redirectWithParams, router]);

  return { user, isLoading, isAuthenticated };
}

// Hook for protecting API routes or checking permissions
export function useHasRole(roles: string | string[]): boolean {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

// Hook for checking specific permissions
export function usePermission() {
  const { user } = useAuth();

  return {
    can: (permission: Permission) => {
      if (!user?.role) return false;
      return hasPermission(user.role, permission);
    },
    isAdmin: user ? hasPermission(user.role, 'users:manage') : false,
    isManager: user ? hasPermission(user.role, 'team:view') && !hasPermission(user.role, 'users:manage') : false,
    canViewTeam: user ? hasPermission(user.role, 'team:view') : false,
    canManageContacts: user ? hasPermission(user.role, 'contacts:delete:all') : false,
  };
}
