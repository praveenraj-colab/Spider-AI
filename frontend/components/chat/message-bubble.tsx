"use client";

import { Check, Copy, RefreshCcw } from "lucide-react";
import * as React from "react";

import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  message: Message;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
};

export function MessageBubble({ message, onRegenerate, canRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === "user";

  async function copy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  }

  return (
    <article className={cn("group flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(780px,92%)] rounded-lg border px-4 py-3",
          isUser ? "bg-primary text-primary-foreground" : "bg-card"
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase opacity-75">
            {isUser ? "You" : "Spider AI"}
          </span>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant={isUser ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              aria-label="Copy message"
              title="Copy message"
              onClick={copy}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            {!isUser && canRegenerate ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Regenerate"
                title="Regenerate"
                onClick={onRegenerate}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        </div>
        <MarkdownRenderer content={message.content} />
      </div>
    </article>
  );
}
