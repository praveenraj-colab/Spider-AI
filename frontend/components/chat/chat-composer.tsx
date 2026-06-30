"use client";

import * as React from "react";
import { SendHorizonal, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatComposerProps = {
  disabled?: boolean;
  isStreaming: boolean;
  onSend: (content: string) => Promise<void>;
  onStop: () => void;
};

export function ChatComposer({ disabled, isStreaming, onSend, onStop }: ChatComposerProps) {
  const [content, setContent] = React.useState("");

  async function submit() {
    const trimmed = content.trim();
    if (!trimmed || disabled || isStreaming) {
      return;
    }
    setContent("");
    await onSend(trimmed);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto flex max-w-4xl items-end gap-2">
        <Textarea
          value={content}
          rows={1}
          disabled={disabled || isStreaming}
          placeholder="Message Spider AI"
          className="max-h-44 min-h-12 resize-none"
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {isStreaming ? (
          <Button type="button" size="icon" variant="destructive" aria-label="Stop generation" title="Stop generation" onClick={onStop}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" size="icon" aria-label="Send message" title="Send message" disabled={disabled || !content.trim()} onClick={() => void submit()}>
            <SendHorizonal className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
