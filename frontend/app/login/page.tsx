import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const successMessage =
    params?.registered === "1" ? "Account created successfully. Log in to continue." : undefined;

  return (
    <AuthShell
      title="Welcome back"
      description="Log in to your Spider AI workspace."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm successMessage={successMessage} />
    </AuthShell>
  );
}
