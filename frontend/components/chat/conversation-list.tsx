"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Chat } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

type ConversationListProps = {
  chats: Chat[];
  activeChatId: string | null;
  onCreate: () => Promise<void>;
  onSelect: (chatId: string) => void;
  onRename: (chatId: string, title: string) => Promise<void>;
  onDelete: (chatId: string) => Promise<void>;
};

export function ConversationList({
  chats,
  activeChatId,
  onCreate,
  onSelect,
  onRename,
  onDelete
}: ConversationListProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState("");

  async function submitRename(chatId: string) {
    const title = editingTitle.trim();
    if (title) {
      await onRename(chatId, title);
    }
    setEditingId(null);
    setEditingTitle("");
  }

  return (
    <aside className="flex h-full w-full flex-col border-r bg-muted/30 lg:w-80">
      <div className="flex h-14 items-center justify-between border-b px-3">
        <span className="text-sm font-medium">Conversations</span>
        <Button type="button" size="icon" variant="ghost" aria-label="New chat" title="New chat" onClick={() => void onCreate()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          <div className="px-3 py-8 text-sm text-muted-foreground">No conversations yet.</div>
        ) : null}
        {chats.map((chat) => {
          const active = chat.id === activeChatId;
          const editing = chat.id === editingId;
          return (
            <div
              key={chat.id}
              className={cn(
                "mb-1 flex min-h-16 cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-secondary",
                active && "bg-secondary"
              )}
              onClick={() => onSelect(chat.id)}
            >
              <div className="min-w-0 flex-1">
                {editing ? (
                  <Input
                    value={editingTitle}
                    autoFocus
                    className="h-8"
                    onChange={(event) => setEditingTitle(event.target.value)}
                    onBlur={() => void submitRename(chat.id)}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void submitRename(chat.id);
                      }
                      if (event.key === "Escape") {
                        setEditingId(null);
                        setEditingTitle("");
                      }
                    }}
                  />
                ) : (
                  <>
                    <p className="truncate text-sm font-medium">{chat.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{formatDateTime(chat.updated_at)}</p>
                  </>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Conversation actions" title="Conversation actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingId(chat.id);
                      setEditingTitle(chat.title);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      void onDelete(chat.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
