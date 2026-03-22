"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[220px]"
        }`}
      >
        <AppHeader />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
