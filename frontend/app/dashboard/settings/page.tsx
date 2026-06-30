import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Workspace-level settings will be configured in a later phase.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Theme, account profile, authentication, and chat history are available in Phase 1. Organization,
          billing, model provider, and workspace policy settings are intentionally excluded.
        </CardContent>
      </Card>
    </main>
  );
}
