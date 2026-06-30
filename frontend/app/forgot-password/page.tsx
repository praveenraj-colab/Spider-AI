import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      description="Password reset delivery is prepared as a Phase 1 placeholder."
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Return to login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
