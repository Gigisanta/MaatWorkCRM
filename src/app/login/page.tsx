'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, LogIn, User, Lock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import Link from 'next/link';
import { MaatWorkLogo } from '@/components/brand';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';

function LoginContent() {
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const oauthError = searchParams.get('error');

  // Show OAuth error as toast when redirected back from Google
  React.useEffect(() => {
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        google: 'No se pudo iniciar sesión con Google. Verifica que la cuenta exista o intenta con otro método.',
        OAuthCallback: 'Error en el callback de OAuth. Intenta de nuevo.',
        OAuthSignin: 'Error al iniciar sesión con OAuth. Intenta de nuevo.',
        OAuthCreateAccount: 'No se pudo crear la cuenta. Intenta de nuevo.',
        Callback: 'Error en el callback. Intenta de nuevo.',
        AccountNotLinked: 'La cuenta no está vinculada.',
      };
      toast.error(errorMessages[oauthError] || `Error de autenticación: ${oauthError}`);
    }
  }, [oauthError]);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(redirect);
    }
  }, [isAuthenticated, authLoading, router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      await login(identifier, password, rememberMe);
    } catch {
      // Error is handled in login function
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090B] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#8B5CF6]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#A78BFA]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8B5CF6]/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-10"
        >
          <MaatWorkLogo size="2xl" showWordmark showTagline />
        </motion.div>

        <Card className="bg-[#0E0F12]/90 backdrop-blur-xl border-white/8">
          <CardHeader className="space-y-1 text-center pb-2">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 }}
              className="mx-auto w-12 h-12 rounded-xl bg-[#8B5CF6]/15 flex items-center justify-center mb-3"
            >
              <LogIn className="h-5 w-5 text-[#A78BFA]" strokeWidth={1.5} />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-[#F0EFE9]">
              Bienvenido
            </CardTitle>
            <CardDescription className="text-[#888888]">
              Ingresa a tu cuenta
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* User/Email field */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-[#888888] text-xs uppercase tracking-wider">
                  Usuario o Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" strokeWidth={1.5} />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="tu@email.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-10 bg-[#08090B] border-[#1C1D21] text-[#F0EFE9] placeholder:text-[#666666] focus:border-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:ring-offset-0 focus-visible:outline-none"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#888888] text-xs uppercase tracking-wider">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" strokeWidth={1.5} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[#08090B] border-[#1C1D21] text-[#F0EFE9] placeholder:text-[#666666] focus:border-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:ring-offset-0 focus-visible:outline-none"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#A78BFA] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-[#1C1D21] data-[state=checked]:bg-[#8B5CF6] data-[state=checked]:border-[#8B5CF6]"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-[#888888] cursor-pointer"
                  >
                    Recordarme
                  </Label>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-[#8B5CF6] hover:bg-[#6D28D9] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Ingresar
                    <ArrowRight className="h-4 w-4 ml-2" strokeWidth={1.5} />
                  </>
                )}
              </Button>
            </form>

            {/* Google Sign In */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1C1D21]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0E0F12] px-2 text-[#666666]">
                  O
                </span>
              </div>
            </div>

            <GoogleSignInButton
              variant="outline"
              className="w-full bg-[#08090B] border-[#1C1D21] text-[#F0EFE9] hover:bg-[#1C1D21] hover:border-[#8B5CF6]"
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
