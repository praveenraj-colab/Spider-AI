"use client";

import * as React from "react";
import { Loader2, MessageSquareText } from "lucide-react";

import { ChatComposer } from "@/components/chat/chat-composer";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Button } from "@/components/ui/button";
import { chatApi } from "@/lib/api-client";
import type { Chat, Message } from "@/lib/types";

const PHASE_ONE_RESPONSE =
  "Message saved. Spider AI Phase 1 intentionally does not call an AI provider, so this chat workspace is storing your conversation history while the streaming interface, markdown rendering, copy, stop, and regenerate controls are ready for model integration in a later phase.";

function createLocalAssistantMessage(chatId: string, content: string): Message {
  const now = new Date().toISOString();
  return {
    id: `local-${crypto.randomUUID()}`,
    chat_id: chatId,
    role: "assistant",
    status: "completed",
    content,
    created_at: now,
    updated_at: now
  };
}

export function ChatWorkspace() {
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const stopRef = React.useRef(false);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    void loadChats();
  }, []);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  async function loadChats() {
    setIsLoading(true);
    setError(null);
    try {
      const nextChats = await chatApi.list();
      setChats(nextChats);
      if (nextChats.length > 0) {
        await selectChat(nextChats[0].id);
      }
    } catch {
      setError("Unable to load conversations.");
    } finally {
      setIsLoading(false);
    }
  }

  async function selectChat(chatId: string) {
    setActiveChatId(chatId);
    setError(null);
    try {
      const detail = await chatApi.get(chatId);
      setMessages(detail.messages);
    } catch {
      setError("Unable to load this conversation.");
    }
  }

  async function createChat() {
    const chat = await chatApi.create();
    setChats((current) => [chat, ...current]);
    setMessages([]);
    setActiveChatId(chat.id);
  }

  async function renameChat(chatId: string, title: string) {
    const updated = await chatApi.rename(chatId, title);
    setChats((current) => current.map((chat) => (chat.id === chatId ? updated : chat)));
  }

  async function deleteChat(chatId: string) {
    await chatApi.delete(chatId);
    const nextChats = chats.filter((chat) => chat.id !== chatId);
    setChats(nextChats);
    if (activeChatId === chatId) {
      const next = nextChats[0];
      if (next) {
        await selectChat(next.id);
      } else {
        setActiveChatId(null);
        setMessages([]);
      }
    }
  }

  async function sendMessage(content: string) {
    let chatId = activeChatId;
    if (!chatId) {
      const created = await chatApi.create();
      setChats((current) => [created, ...current]);
      chatId = created.id;
      setActiveChatId(created.id);
    }

    setError(null);
    const message = await chatApi.createMessage(chatId, content);
    setMessages((current) => [...current, message]);
    const refreshedChats = await chatApi.list();
    setChats(refreshedChats);
    await streamPhaseOneResponse(chatId);
  }

  async function streamPhaseOneResponse(chatId: string) {
    stopRef.current = false;
    setIsStreaming(true);
    const message = createLocalAssistantMessage(chatId, "");
    setMessages((current) => [...current, message]);

    for (let index = 1; index <= PHASE_ONE_RESPONSE.length; index += 1) {
      if (stopRef.current) {
        break;
      }
      const nextContent = PHASE_ONE_RESPONSE.slice(0, index);
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? { ...item, content: nextContent } : item))
      );
      await new Promise((resolve) => window.setTimeout(resolve, 12));
    }

    setIsStreaming(false);
  }

  function stopGeneration() {
    stopRef.current = true;
    setIsStreaming(false);
  }

  async function regenerate() {
    if (!activeChatId || isStreaming) {
      return;
    }
    setMessages((current) => current.filter((message) => !message.id.startsWith("local-")));
    await streamPhaseOneResponse(activeChatId);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="h-72 shrink-0 lg:h-[calc(100vh-4rem)]">
        <ConversationList
          chats={chats}
          activeChatId={activeChatId}
          onCreate={createChat}
          onSelect={(chatId) => void selectChat(chatId)}
          onRename={renameChat}
          onDelete={deleteChat}
        />
      </div>
      <section className="flex min-h-[calc(100vh-22rem)] flex-1 flex-col lg:h-[calc(100vh-4rem)]">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              <div className="mx-auto flex max-w-4xl flex-col gap-5">
                {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
                {!activeChatId && messages.length === 0 ? (
                  <div className="flex min-h-[42vh] flex-col items-center justify-center text-center">
                    <MessageSquareText className="mb-4 h-10 w-10 text-primary" />
                    <h1 className="text-2xl font-semibold">Start a new conversation</h1>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      Your messages are stored securely in Spider AI. Model integrations are outside Phase 1.
                    </p>
                    <Button className="mt-6" onClick={() => void createChat()}>
                      New chat
                    </Button>
                  </div>
                ) : null}
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    canRegenerate={message.id.startsWith("local-") && !isStreaming}
                    onRegenerate={regenerate}
                  />
                ))}
                <div ref={endRef} />
              </div>
            </div>
            <ChatComposer
              disabled={isLoading}
              isStreaming={isStreaming}
              onSend={sendMessage}
              onStop={stopGeneration}
            />
          </>
        )}
      </section>
    </div>
  );
}
