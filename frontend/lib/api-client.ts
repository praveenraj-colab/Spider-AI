import type { ApiError, Chat, ChatDetail, Message, User } from "@/lib/types";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    let payload: ApiError | undefined;
    try {
      payload = (await response.json()) as ApiError;
    } catch {
      payload = undefined;
    }
    const validationMessage = payload?.errors
      ?.map((error) => error.message)
      .filter(Boolean)
      .join(" ");
    throw new ApiClientError(
      validationMessage || payload?.message || payload?.error?.message || "Request failed.",
      response.status,
      payload?.error?.code
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const authApi = {
  login: (payload: { email: string; password: string }) =>
    request<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  register: (payload: { full_name: string; email: string; password: string }) =>
    request<{ user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  refresh: () => request<{ user: User }>("/api/auth/refresh", { method: "POST" })
};

export const userApi = {
  me: () => request<User>("/api/proxy/users/me"),
  update: (payload: { full_name: string }) =>
    request<User>("/api/proxy/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload)
    })
};

export const chatApi = {
  list: () => request<Chat[]>("/api/proxy/chats/"),
  create: (title = "New chat") =>
    request<Chat>("/api/proxy/chats/", {
      method: "POST",
      body: JSON.stringify({ title })
    }),
  get: (chatId: string) => request<ChatDetail>(`/api/proxy/chats/${chatId}`),
  rename: (chatId: string, title: string) =>
    request<Chat>(`/api/proxy/chats/${chatId}`, {
      method: "PATCH",
      body: JSON.stringify({ title })
    }),
  delete: (chatId: string) =>
    request<{ deleted: boolean }>(`/api/proxy/chats/${chatId}`, {
      method: "DELETE"
    }),
  createMessage: (chatId: string, content: string) =>
    request<Message>(`/api/proxy/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content })
    })
};
