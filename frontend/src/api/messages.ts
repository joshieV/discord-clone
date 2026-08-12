import { apiFetch } from "./client";

export interface ChatMessage {
  id: number;
  content: string;
  author: string;
  createdAt: string;
}

export function getHistory(roomName: string): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(`/api/rooms/${roomName}/messages`);
}
