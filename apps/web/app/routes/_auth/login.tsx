// ============================================================
// MaatWork CRM — Login Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { Chrome, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-brand-500/25">
            M
          </div>
          <h1 className="text-3xl font-bold text-white">MaatWork CRM</h1>
          <p className="text-surface-400 mt-2">Inicia sesión en tu cuenta</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8">
          {/* Google OAuth */}
          <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-lg text-white font-medium transition-all mb-6">
            <Chrome className="w-5 h-5" />
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-surface-700" />
            <span className="text-xs text-surface-500 uppercase">o con email</span>
            <div className="flex-1 h-px bg-surface-700" />
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm text-surface-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-surface-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-brand-600/25"
            >
              Iniciar Sesión
            </button>
          </form>

          <p className="text-center text-sm text-surface-400 mt-6">
            ¿No tienes cuenta?{" "}
            <a href="/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Regístrate
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
