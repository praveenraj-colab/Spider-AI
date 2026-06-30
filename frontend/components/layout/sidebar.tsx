"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareText, Settings, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquareText },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r bg-background md:block">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/dashboard/chat" className="text-lg font-semibold">
          Spider AI
        </Link>
      </div>
      <nav className="space-y-1 p-3">
        {navigation.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn("w-full justify-start gap-3", active && "bg-secondary")}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
