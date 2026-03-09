// ============================================================
// MaatWork CRM — App Layout (Authenticated Shell)
// UI/UX REFINED BY JULES v2
// ============================================================

import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "~/components/layout/Sidebar";
import { AICopilot } from "~/components/ui/AICopilot";
import { CommandPalette } from "~/components/ui/CommandPalette";
import { cn } from "~/lib/utils";

// ============================================================
// MaatWork CRM — App Layout (Authenticated Shell)
// UI/UX REFINED BY JULES v2
// ============================================================

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Listen for custom event to open Copilot from Sidebar
  useEffect(() => {
    const handleOpenCopilot = () => setIsCopilotOpen(true);
    window.addEventListener("open-ai-copilot", handleOpenCopilot);
    return () => window.removeEventListener("open-ai-copilot", handleOpenCopilot);
  }, []);

  return (
    <div className="app-layout bg-background text-text min-h-screen font-sans selection:bg-primary/30 selection:text-primary-light">
      {/* Accessibility: Live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="a11y-announcements" />

      {/* Global Features */}
      <CommandPalette />
      <AICopilot open={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />

      {/* Sidebar handles Header, Drawer, and Desktop Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main
        className={cn(
          "app-main flex-1 min-w-0 min-h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed ? "lg:ml-20" : "lg:ml-64",
          "px-4 sm:px-6 lg:px-8",
          "pt-20 sm:pt-24 lg:pt-24",
          "pb-24 sm:pb-28 lg:pb-12 safe-area-bottom",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-[1600px] mx-auto w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
