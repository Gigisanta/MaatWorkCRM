// ============================================================
// MaatWork CRM — App Layout (Authenticated Shell)
// ============================================================

import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Sidebar } from "~/components/layout/Sidebar";
import { useEffect, useState, useRef } from "react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedContent, setDisplayedContent] = useState<React.ReactNode>(<Outlet />);
  const previousPathname = useRef(location.pathname);

  // Handle page transitions
  useEffect(() => {
    if (location.pathname !== previousPathname.current) {
      setIsTransitioning(true);
      const timeout = setTimeout(() => {
        setDisplayedContent(<Outlet />);
        setIsTransitioning(false);
        previousPathname.current = location.pathname;
      }, 150);
      return () => clearTimeout(timeout);
    } else {
      setDisplayedContent(<Outlet />);
    }
  }, [location.pathname]);

  return (
    <div className="app-layout">
      {/* Sidebar handles Header, Drawer, and Desktop Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <main
        className={[
          "app-main",
          "min-h-screen transition-all duration-300 ease-in-out",
          collapsed ? "lg:ml-16" : "lg:ml-52",
          "px-3 xs:px-4 sm:px-6 lg:px-8",
          "pt-3 sm:pt-4 lg:pt-6",
          "pb-24 sm:pb-28 lg:pb-8 safe-area-bottom",
        ].join(" ")}
      >
        <div
          className={[
            "transition-opacity duration-150 ease-out",
            isTransitioning ? "opacity-0 scale-[0.99]" : "opacity-100 scale-100",
          ].join(" ")}
        >
          <div className="animate-fade-in max-w-[1600px] mx-auto">
            {displayedContent}
          </div>
        </div>
      </main>
    </div>
  );
}
