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
            ? "bg-white border border-gray-200"
            : "bg-primary-500 text-white"
        } rounded-2xl px-4 py-3 shadow-sm`}
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
