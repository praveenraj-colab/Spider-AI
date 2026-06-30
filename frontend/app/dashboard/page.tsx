"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function roleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Signed in as {user?.full_name}</p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/dashboard/chat">
              Open chat
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Name</CardTitle>
              <UserRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="truncate text-lg font-semibold">{user?.full_name}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="truncate text-lg font-semibold">{user?.email}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Role</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="truncate text-lg font-semibold">{user ? roleLabel(user.role) : null}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
