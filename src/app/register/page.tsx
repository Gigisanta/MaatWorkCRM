'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, UserPlus, Mail, Lock, User, Briefcase, ArrowRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { getAvailableRoles, getRoleDisplayName } from '@/lib/auth-helpers';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Manager {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function RegisterPage() {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [role, setRole] = React.useState('');
  const [managerId, setManagerId] = React.useState('');
  const [managers, setManagers] = React.useState<Manager[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const availableRoles = getAvailableRoles();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch managers when role is advisor
  React.useEffect(() => {
    if (role === 'advisor') {
      fetchManagers();
    }
  }, [role]);

  const fetchManagers = async () => {
    setIsLoadingManagers(true);
    try {
      const response = await fetch('/api/auth/managers');
      const data = await response.json();
      setManagers(data.managers || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('Error al cargar gerentes');
    } finally {
      setIsLoadingManagers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!fullName || !email || !password || !role) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (role === 'advisor' && !managerId) {
      toast.error('Por favor selecciona un gerente');
      return;
    }

    setIsLoading(true);
    
    try {
      await register({
        fullName,
        email,
        password,
        role,
        managerId: role === 'advisor' ? managerId : undefined,
      });
      
      toast.success('Cuenta creada exitosamente. Pendiente de aprobación.');
    } catch {
      // Error is handled in register function
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-strong border-white/10">
          <CardHeader className="space-y-1 text-center pb-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4"
            >
              <UserPlus className="h-6 w-6 text-emerald-400" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-white">
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-slate-400">
              Únete a MaatWork CRM
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">
                  Nombre completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500"
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-300">
                  Rol
                </Label>
                <Select value={role} onValueChange={setRole} disabled={isLoading}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                    <Briefcase className="h-4 w-4 text-slate-500 mr-2" />
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {availableRoles.map((r) => (
                      <SelectItem 
                        key={r.value} 
                        value={r.value}
                        className="text-white hover:bg-white/10"
                      >
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Manager selector (only for advisors) */}
              {role === 'advisor' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Label htmlFor="manager" className="text-slate-300">
                    Gerente
                  </Label>
                  <Select 
                    value={managerId} 
                    onValueChange={setManagerId} 
                    disabled={isLoading || isLoadingManagers}
                  >
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                      <ChevronDown className="h-4 w-4 text-slate-500 mr-2" />
                      <SelectValue placeholder={isLoadingManagers ? "Cargando..." : "Selecciona un gerente"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {managers.map((manager) => (
                        <SelectItem 
                          key={manager.id} 
                          value={manager.id}
                          className="text-white hover:bg-white/10"
                        >
                          {manager.name || manager.email} ({getRoleDisplayName(manager.role)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirma tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    Crear cuenta
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-slate-500">
                  O
                </span>
              </div>
            </div>

            {/* Login link */}
            <div className="text-center">
              <p className="text-sm text-slate-400">
                ¿Ya tienes una cuenta?{' '}
                <Link
                  href="/login"
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-4 glass rounded-lg border-white/10"
        >
          <p className="text-xs text-slate-400 text-center">
            Tu cuenta necesitará aprobación de un administrador antes de poder acceder al sistema.
          </p>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-slate-500 mt-6"
        >
          © {new Date().getFullYear()} MaatWork CRM. Todos los derechos reservados.
        </motion.p>
      </motion.div>
    </div>
  );
}
