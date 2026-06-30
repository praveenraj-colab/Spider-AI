"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, LockKeyhole, MessageSquareText, Moon, PanelsTopLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: MessageSquareText,
    title: "Focused Conversations",
    description: "Create, rename, delete, and revisit chat threads from a workspace built for daily use."
  },
  {
    icon: LockKeyhole,
    title: "Secure Authentication",
    description: "JWT access tokens, refresh-token rotation, bcrypt hashing, and server-side cookie handling."
  },
  {
    icon: PanelsTopLeft,
    title: "Operational Dashboard",
    description: "A clean sidebar, profile area, top navigation, settings surface, and responsive layouts."
  },
  {
    icon: Moon,
    title: "Dark Mode Ready",
    description: "System-aware theme switching across the landing page, dashboard, and chat experience."
  },
  {
    icon: ShieldCheck,
    title: "Production Foundation",
    description: "FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL, Docker, and structured validation."
  },
  {
    icon: Bot,
    title: "AI-Ready Interface",
    description: "Streaming, markdown, copy, stop, and regenerate controls without Phase 1 model integrations."
  }
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative flex min-h-[82vh] items-center overflow-hidden">
        <Image
          src="/images/spider-ai-hero.png"
          alt="Spider AI workspace interface"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.84),rgba(3,7,18,0.58),rgba(3,7,18,0.16))]" />
        <div className="container relative z-10 py-20 text-white">
          <nav className="mb-20 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold">
              Spider AI
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="bg-white text-slate-950 hover:bg-white/90" asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <p className="mb-4 text-sm font-medium uppercase text-teal-200">Your Intelligent AI Workspace</p>
            <h1 className="text-5xl font-semibold leading-tight sm:text-6xl lg:text-7xl">Spider AI</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-100">
              A secure, modern assistant platform foundation with authentication, dashboard workflows,
              and a polished chat experience ready for production growth.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/register">
                  Start workspace <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" asChild>
                <Link href="/login">Open dashboard</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b bg-background py-16">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase text-primary">Phase 1 platform</p>
            <h2 className="mt-2 text-3xl font-semibold">Built as a SaaS foundation, not a throwaway demo.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-muted/40 py-16">
        <div className="container grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase text-primary">Pricing</p>
            <h2 className="mt-2 text-3xl font-semibold">Plans will be configured after billing is introduced.</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Phase 1 includes the product-ready pricing surface without payment processing, plan enforcement,
              or checkout flows.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold">$0</div>
              <p className="mt-2 text-sm text-muted-foreground">Phase 1 environment</p>
              <Button className="mt-6 w-full" asChild>
                <Link href="/register">Create account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="bg-background py-8">
        <div className="container flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Spider AI. All rights reserved.</p>
          <p>Secure assistant workspace foundation.</p>
        </div>
      </footer>
    </main>
  );
}
