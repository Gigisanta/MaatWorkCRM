// ============================================================
// MaatWork CRM — Register Page (Premium Experience)
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Chrome, Eye, EyeOff, Lock, Mail, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { signIn, signUp } from "~/lib/auth-client";

export const Route = createFileRoute("/_auth/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const redirect = searchParams?.get("redirect") || "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement instanceof HTMLInputElement) {
        e.preventDefault();
        const form = document.querySelector("form");
        form?.requestSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || "Registration failed");
        setIsLoading(false);
      } else {
        setSuccess(true);
        setIsLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signIn.social({
        provider: "google",
        callbackURL: redirect,
      });
    } catch (error) {
      console.error("Google sign up error:", error);
      setError("Failed to sign up with Google. Please try again.");
    }
  };

  if (!mounted) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute -top-[30%] -left-[15%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10 blur-[150px]"
          />
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-accent/15 via-accent/5 to-primary/10 blur-[120px]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/0 via-transparent to-background/40" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md relative z-10"
        >
          <div className="p-8 text-center bg-surface/50 backdrop-blur-sm border border-border rounded-2xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <Mail className="w-8 h-8 text-green-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-text mb-3">Check your email</h2>
            <p className="text-text-secondary mb-6">
              We've sent a verification link to <span className="font-medium text-text">{email}</span>
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-light font-medium transition-colors"
            >
              Back to login
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute -top-[30%] -left-[15%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10 blur-[150px]"
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-accent/15 via-accent/5 to-primary/10 blur-[120px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/0 via-transparent to-background/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.15, duration: 0.8, type: "spring", stiffness: 200, damping: 15 }}
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 border border-white/10 cursor-pointer"
          >
            <Sparkles className="w-8 h-8" strokeWidth={2.5} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-text tracking-tight mb-2">Create your account</h1>
            <p className="text-text-secondary text-sm">Start your MaatWork journey</p>
          </motion.div>
        </div>

        <div className="p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-0 border border-white/5 rounded-[inherit] group-hover:border-primary/30 transition-all duration-500 pointer-events-none" />

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface hover:bg-surface-hover border border-border rounded-lg text-text font-medium transition-all mb-6 shadow-sm hover:shadow-md hover:border-border-hover group/oauth"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6, ease: "linear" }}
            >
              <Chrome className="w-5 h-5 text-text-secondary" />
            </motion.div>
            <span className="group-hover/oauth:ml-2 transition-all">Continue with Google</span>
          </motion.button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border group/separator" />
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">or continue with email</span>
            <div className="flex-1 h-px bg-border group/separator" />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary ml-1">Full name</label>
              <div className="relative group/input">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within/input:text-primary group-focus-within/input:scale-110 transition-all" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary ml-1">Email address</label>
              <div className="relative group/input">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within/input:text-primary group-focus-within/input:scale-110 transition-all" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary ml-1">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within/input:text-primary group-focus-within/input:scale-110 transition-all" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-12 py-3 bg-surface/50 border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  data-testid="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all group/toggle:active:scale-95"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <motion.div
                    animate={{ rotate: showPassword ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
                  </motion.div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary ml-1">Confirm password</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within/input:text-primary group-focus-within/input:scale-110 transition-all" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-12 py-3 bg-surface/50 border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  data-testid="confirm-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all group/toggle:active:scale-95"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <motion.div
                    animate={{ rotate: showConfirmPassword ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
                  </motion.div>
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-8">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:text-primary-light font-medium transition-colors">
            Sign in
          </a>
        </p>
      </motion.div>
    </div>
  );
}
