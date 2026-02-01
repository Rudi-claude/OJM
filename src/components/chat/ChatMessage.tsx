"use client";

import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
  children?: React.ReactNode;
}

export default function ChatMessage({ message, children }: ChatMessageProps) {
  const isBot = message.type === "bot";

  return (
    <div
      className={`flex ${isBot ? "justify-start" : "justify-end"} mb-4`}
    >
      <div
        className={`max-w-[80%] ${
          isBot
            ? "bg-white border border-gray-100 shadow-sm"
            : "bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white shadow-lg shadow-[#6B77E8]/20"
        } rounded-2xl px-4 py-3`}
      >
        {message.content && (
          <p className={`text-sm ${isBot ? "text-gray-800" : "text-white"}`}>
            {message.content}
          </p>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}
