"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/utils";

interface ThemeToggleProps {
  variant?: "icon" | "dropdown" | "segmented";
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ 
  variant = "icon", 
  showLabel = false,
  className 
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={cn("text-slate-400", className)}>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  // Icon variant - simple toggle button with dropdown for system option
  if (variant === "icon") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("text-slate-400 hover:text-white relative", className)}
          >
            {resolvedTheme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            {theme === "system" && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-violet-500" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Tema</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setTheme("light")}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>Claro</span>
            </div>
            {theme === "light" && <Check className="h-4 w-4 text-violet-500" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme("dark")}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>Oscuro</span>
            </div>
            {theme === "dark" && <Check className="h-4 w-4 text-violet-500" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme("system")}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>Sistema</span>
            </div>
            {theme === "system" && <Check className="h-4 w-4 text-violet-500" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Segmented control variant - inline buttons
  if (variant === "segmented") {
    return (
      <div className={cn(
        "flex items-center gap-1 p-1 rounded-lg glass border border-white/8",
        className
      )}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme("light")}
          className={cn(
            "text-slate-400 hover:text-white hover:bg-white/10",
            theme === "light" && "bg-white/10 text-white"
          )}
        >
          <Sun className="h-4 w-4 mr-1" />
          Claro
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme("dark")}
          className={cn(
            "text-slate-400 hover:text-white hover:bg-white/10",
            theme === "dark" && "bg-white/10 text-white"
          )}
        >
          <Moon className="h-4 w-4 mr-1" />
          Oscuro
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme("system")}
          className={cn(
            "text-slate-400 hover:text-white hover:bg-white/10",
            theme === "system" && "bg-white/10 text-white"
          )}
        >
          <Monitor className="h-4 w-4 mr-1" />
          Sistema
        </Button>
      </div>
    );
  }

  // Dropdown variant with label
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "glass border-white/8 bg-transparent text-slate-300 hover:text-white hover:bg-white/10",
            className
          )}
        >
          {theme === "light" ? (
            <>
              <Sun className="h-4 w-4 mr-2" />
              Claro
            </>
          ) : theme === "dark" ? (
            <>
              <Moon className="h-4 w-4 mr-2" />
              Oscuro
            </>
          ) : (
            <>
              <Monitor className="h-4 w-4 mr-2" />
              Sistema
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Claro</span>
          </div>
          {theme === "light" && <Check className="h-4 w-4 text-violet-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Oscuro</span>
          </div>
          {theme === "dark" && <Check className="h-4 w-4 text-violet-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>Sistema</span>
          </div>
          {theme === "system" && <Check className="h-4 w-4 text-violet-500" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Theme preview card for settings page
export function ThemePreviewCard({ 
  themeMode, 
  isActive,
  onClick 
}: { 
  themeMode: "light" | "dark" | "system";
  isActive: boolean;
  onClick: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && (
    themeMode === "light" || 
    (themeMode === "system" && resolvedTheme === "light")
  );

  const icons = {
    light: <Sun className="h-5 w-5" />,
    dark: <Moon className="h-5 w-5" />,
    system: <Monitor className="h-5 w-5" />,
  };

  const labels = {
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",
  };

  const descriptions = {
    light: "Fondo claro con colores suaves",
    dark: "Fondo oscuro con acentos brillantes",
    system: "Sigue la preferencia del sistema",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        isActive
          ? "border-violet-500 ring-2 ring-violet-500/20"
          : "border-transparent",
        isLight
          ? "bg-slate-100 text-slate-900"
          : "bg-slate-800 text-white"
      )}
    >
      {/* Preview mini-window */}
      <div className={cn(
        "w-full h-20 rounded-lg mb-3 overflow-hidden",
        isLight ? "bg-white border border-slate-200" : "bg-slate-900 border border-slate-700"
      )}>
        <div className={cn(
          "h-4 flex items-center gap-1 px-2",
          isLight ? "bg-slate-50" : "bg-slate-800"
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full", isLight ? "bg-slate-300" : "bg-slate-600")} />
          <div className={cn("w-1.5 h-1.5 rounded-full", isLight ? "bg-slate-300" : "bg-slate-600")} />
          <div className={cn("w-1.5 h-1.5 rounded-full", isLight ? "bg-slate-300" : "bg-slate-600")} />
        </div>
        <div className="p-2 space-y-1">
          <div className={cn("h-2 rounded w-3/4", isLight ? "bg-slate-200" : "bg-slate-700")} />
          <div className={cn("h-2 rounded w-1/2", isLight ? "bg-slate-200" : "bg-slate-700")} />
          <div className={cn("h-2 rounded w-2/3", isLight ? "bg-violet-200" : "bg-violet-500/30")} />
        </div>
      </div>

      {/* Icon and label */}
      <div className={cn(
        "mb-1",
        isActive 
          ? isLight ? "text-violet-600" : "text-violet-400"
          : isLight ? "text-slate-600" : "text-slate-300"
      )}>
        {icons[themeMode]}
      </div>
      <span className={cn(
        "font-medium text-sm",
        isActive && (isLight ? "text-violet-600" : "text-violet-400")
      )}>
        {labels[themeMode]}
      </span>
      <span className={cn(
        "text-xs mt-0.5",
        isLight ? "text-slate-500" : "text-slate-400"
      )}>
        {descriptions[themeMode]}
      </span>

      {/* Active indicator */}
      {isActive && (
        <div className={cn(
          "absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center",
          isLight ? "bg-violet-500" : "bg-violet-500"
        )}>
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}
