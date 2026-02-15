import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string; // base64 image data URL
  timestamp: number;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Simple markdown-like parsing for code blocks
  const renderContent = (content: string) => {
    const parts: JSX.Element[] = [];
    let remaining = content;
    let keyIndex = 0;

    // Match code blocks ```language\ncode\n```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index);
        parts.push(
          <span key={keyIndex++} className="whitespace-pre-wrap">
            {renderInlineCode(text)}
          </span>
        );
      }

      // Add code block
      const language = match[1] || "python";
      const code = match[2];
      parts.push(
        <div key={keyIndex++} className="my-2 rounded-lg overflow-hidden">
          <div className="bg-gray-800 text-gray-400 text-xs px-3 py-1 font-mono">
            {language}
          </div>
          <pre className="bg-gray-900 text-gray-100 p-3 overflow-x-auto text-sm font-mono">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={keyIndex++} className="whitespace-pre-wrap">
          {renderInlineCode(content.slice(lastIndex))}
        </span>
      );
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{content}</span>;
  };

  // Handle inline code `code`
  const renderInlineCode = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    const inlineRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <code
          key={keyIndex++}
          className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
        >
          {match[1]}
        </code>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3 p-4", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-brand-primary" : "bg-gray-200"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-gray-600" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          isUser
            ? "bg-brand-primary text-white rounded-tr-sm"
            : "bg-gray-100 text-gray-800 rounded-tl-sm"
        )}
      >
        <div className="text-sm leading-relaxed">{renderContent(message.content)}</div>

        {/* Image if present */}
        {message.image && (
          <div className="mt-2">
            <img
              src={message.image}
              alt="AI generated visualization"
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
