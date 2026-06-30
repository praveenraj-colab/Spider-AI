export type User = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export type Chat = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "created" | "streaming" | "completed" | "failed";

export type Message = {
  id: string;
  chat_id: string;
  role: MessageRole;
  status: MessageStatus;
  content: string;
  created_at: string;
  updated_at: string;
};

export type ChatDetail = Chat & {
  messages: Message[];
};

export type ApiError = {
  error?: {
    message?: string;
    code?: string;
    request_id?: string;
    details?: unknown;
  };
};
