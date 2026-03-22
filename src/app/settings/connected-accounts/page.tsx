'use client';

import * as React from 'react';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Link2, Link2Off, Key, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface LinkedAccount {
  providerId: string;
  providerType: string;
  createdAt: string;
}

interface AccountsResponse {
  accounts: LinkedAccount[];
  hasPassword: boolean;
}

async function fetchAccounts(): Promise<AccountsResponse> {
  const res = await fetch('/api/accounts');
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

async function disconnectAccount(providerId: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/accounts/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to disconnect account');
  }
  return res.json();
}

export default function ConnectedAccountsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['linked-accounts'],
    queryFn: fetchAccounts,
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked-accounts'] });
      toast.success('Cuenta desvinculada correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleLinkGoogle = () => {
    signIn('google', { callbackUrl: '/settings/connected-accounts' });
  };

  const handleDisconnect = (providerId: string) => {
    disconnectMutation.mutate(providerId);
  };

  const googleAccount = data?.accounts.find((a) => a.providerId === 'google');
  const canDisconnectGoogle = data && (data.accounts.length > 1 || data.hasPassword);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Cuentas Vinculadas</h2>
        <p className="text-sm text-slate-400 mt-1">
          Gestiona tus cuentas vinculadas y métodos de acceso
        </p>
      </div>

      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-400">Error al cargar las cuentas vinculadas</p>
          </CardContent>
        </Card>
      )}

      {/* Google Account Card */}
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border-white/8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-violet-500/10 p-2.5 rounded-xl">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <div>
                <CardTitle className="text-base font-medium text-white">Google</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Vinculado con tu cuenta de Google
                </CardDescription>
              </div>
            </div>
            {googleAccount ? (
              <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                Vinculada
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-500/10 text-slate-400 border-slate-500/20">
                No vinculada
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleAccount ? (
            <>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-violet-400" />
                  <span className="text-sm text-slate-300">{user?.email}</span>
                </div>
                <span className="text-xs text-slate-500">
                  Vinculada el {new Date(googleAccount.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Link2Off className="h-3.5 w-3.5" />
                  Desvincular cuenta de Google
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect('google')}
                  disabled={!canDisconnectGoogle || disconnectMutation.isPending}
                  className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : null}
                  Desvincular
                </Button>
              </div>
              {!canDisconnectGoogle && (
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Necesitas una contraseña o otro método de acceso para desvincular Google
                </p>
              )}
            </>
          ) : (
            <Button
              variant="outline"
              onClick={handleLinkGoogle}
              className="w-full border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Vincular cuenta de Google
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border-white/8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-violet-500/10 p-2.5 rounded-xl">
                <Key className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-base font-medium text-white">Contraseña</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Contraseña para acceso con email
                </CardDescription>
              </div>
            </div>
            {data?.hasPassword ? (
              <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                Configurada
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                No configurada
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data?.hasPassword ? (
            <p className="text-sm text-slate-400 py-2 px-3 rounded-lg bg-white/5">
              Tu contraseña esta configurada. Puedes cambiarla en cualquier momento.
            </p>
          ) : (
            <p className="text-sm text-slate-400 py-2 px-3 rounded-lg bg-white/5">
              No tienes una contraseña configurada. Te recomendamos configurar una para poder acceder sin Google.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
