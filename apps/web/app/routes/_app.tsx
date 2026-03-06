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
      {/* Global Features */}
      <CommandPalette />
      <AICopilot open={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />

      {/* Sidebar handles Header, Drawer, and Desktop Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main
        className={[
          "app-main",
          "min-h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed ? "lg:ml-20" : "lg:ml-64",
          "px-4 sm:px-6 lg:px-8",
          "pt-20 sm:pt-24 lg:pt-24", // Account for fixed header
          "pb-24 sm:pb-28 lg:pb-12 safe-area-bottom",
        ].join(" ")}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-[1600px] mx-auto w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
