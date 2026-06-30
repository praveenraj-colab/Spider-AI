"use client";

import * as React from "react";

import { authApi, userApi } from "@/lib/api-client";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { full_name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    const response = await authApi.refresh();
    setUser(response.user);
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const me = await userApi.me();
        if (mounted) {
          setUser(me);
        }
      } catch {
        try {
          const refreshed = await authApi.refresh();
          if (mounted) {
            setUser(refreshed.user);
          }
        } catch {
          if (mounted) {
            setUser(null);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      setUser,
      refresh,
      login: async (payload) => {
        const response = await authApi.login(payload);
        setUser(response.user);
      },
      register: async (payload) => {
        const response = await authApi.register(payload);
        setUser(response.user);
      },
      logout: async () => {
        await authApi.logout();
        setUser(null);
      }
    }),
    [isLoading, refresh, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
