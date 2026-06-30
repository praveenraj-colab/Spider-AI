"use client";

import { Loader2 } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuthGuard();

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        {children}
      </div>
    </div>
  );
}
