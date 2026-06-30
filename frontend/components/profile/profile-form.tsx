"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userApi } from "@/lib/api-client";

export function ProfileForm() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = React.useState(user?.full_name ?? "");
  const [message, setMessage] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setFullName(user?.full_name ?? "");
  }, [user]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    const updated = await userApi.update({ full_name: fullName });
    setUser(updated);
    setMessage("Profile updated.");
    setIsSaving(false);
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your account identity.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              minLength={2}
              maxLength={160}
              required
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{user?.email}</p>
            <p>Account status: {user?.is_active ? "Active" : "Inactive"}</p>
          </div>
          {message ? <p className="text-sm text-primary">{message}</p> : null}
          <Button type="submit" className="gap-2" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
