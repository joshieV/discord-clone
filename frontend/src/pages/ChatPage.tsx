import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHistory, type ChatMessage } from "../api/messages";
import { useChatSocket } from "../hooks/useChatSocket";

const ROOM = "general";

export default function ChatPage() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { connected, sendMessage } = useChatSocket(ROOM, (msg) => {
    setMessages((prev) => [...prev, msg]);
  });

  useEffect(() => {
    getHistory(ROOM)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft.trim());
    setDraft("");
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <span>#{ROOM}</span>
        <span className={connected ? "status online" : "status offline"}>
          {connected ? "connected" : "connecting..."}
        </span>
        <span className="chat-user">
          {username} <button onClick={handleLogout}>Log out</button>
        </span>
      </header>

      <div className="message-list">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <span className="message-author">{msg.author}</span>
            <span className="message-time">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <p>{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="message-form" onSubmit={handleSend}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message #${ROOM}`}
        />
        <button type="submit" disabled={!connected}>
          Send
        </button>
      </form>
    </div>
  );
}
