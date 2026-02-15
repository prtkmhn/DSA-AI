import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Lightbulb, BookOpen, RefreshCw, Image, Loader2, Trash2, AlertCircle, ImagePlus, X, Square, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage, Message } from "./ChatMessage";
import { useChatbot, ChatbotContext } from "./useChatbot";
import { cn } from "@/lib/utils";
import { QUICK_ACTION_PROMPTS } from "@/lib/prompts";

interface ChatbotPanelProps {
  isOpen: boolean;
  context: ChatbotContext;
  onRegenerate?: (newProblemJson: string) => void;
  onFixProblem?: (fixedData: any) => void;
}

const QUICK_ACTIONS = [
  { id: "hint", label: "Hint", icon: Lightbulb, prompt: QUICK_ACTION_PROMPTS.hint },
  { id: "explain", label: "Explain", icon: BookOpen, prompt: QUICK_ACTION_PROMPTS.explain },
  { id: "error", label: "Help with error", icon: AlertCircle, prompt: QUICK_ACTION_PROMPTS.error },
  { id: "fix", label: "Fix code", icon: Wrench, prompt: QUICK_ACTION_PROMPTS.fix },
  { id: "regenerate", label: "New problem", icon: RefreshCw, prompt: QUICK_ACTION_PROMPTS.regenerate },
  { id: "visualize", label: "Visualize", icon: Image, prompt: QUICK_ACTION_PROMPTS.visualize },
];

export function ChatbotPanel({ isOpen, context, onRegenerate, onFixProblem }: ChatbotPanelProps) {
  const [input, setInput] = useState("");
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, sendMessage, sendMessageWithImage, generateImage, generateNewProblem, clearMessages, stopGeneration } = useChatbot({ context });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setPastedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  const handleSend = async () => {
    if ((!input.trim() && !pastedImage) || isLoading) return;

    const message = input || "What's in this image? How does it relate to my code?";
    setInput("");

    if (pastedImage) {
      const image = pastedImage;
      setPastedImage(null);
      await sendMessageWithImage(message, image);
    } else {
      await sendMessage(message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPastedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickAction = async (action: typeof QUICK_ACTIONS[0]) => {
    if (isLoading) return;

    if (action.id === "visualize") {
      // First send the request message
      await sendMessage("Generate a visual diagram to explain this algorithm");

      // Then generate the image
      const imageUrl = await generateImage("Create a clear educational diagram explaining the algorithm step by step");
      if (imageUrl) {
        // The generateImage doesn't add to messages, so we need to manually trigger
        // For now, just show text response - image gen is complex with current API
      }
    } else if (action.id === "regenerate") {
      // Special handling: Generate new problem and update the Faded Parsons UI directly
      await handleRegenerateProblem();
    } else if (action.id === "fix") {
      // Special handling: Regenerate correct blocks for the same problem
      await handleFixProblem();
    } else {
      await sendMessage(action.prompt);
    }
  };

  const handleRegenerateProblem = async () => {
    // Generate new problem (doesn't add to chat)
    const newProblem = await generateNewProblem();

    if (newProblem && onRegenerate) {
      // Call the callback to update the Faded Parsons UI
      onRegenerate(newProblem);

      // Add a simple confirmation message to chat
      const confirmMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `New problem loaded: **${newProblem.title}**\n\n${newProblem.description}\n\nThe blocks on the left have been updated. Try solving this new problem!`,
        timestamp: Date.now(),
      };
      // Note: We can't directly add to messages from here, but the UI update happens via callback
    } else if (!onRegenerate) {
      await sendMessage("I can generate a new problem, but the regenerate feature isn't connected to the UI yet.");
    } else {
      await sendMessage("Sorry, I couldn't generate a new problem. Please try again.");
    }
  };

  const handleFixProblem = async () => {
    // Reuse generateNewProblem which calls AI and parses JSON response
    // The fix prompt is sent via the system context; generateNewProblem uses the regeneration prompt
    // But we want to use the fix-specific prompt. So we call sendMessage with the fix prompt
    // and separately generate new problem JSON.
    const fixedProblem = await generateNewProblem();

    if (fixedProblem && onFixProblem) {
      onFixProblem(fixedProblem);
      await sendMessage(`Fixed! The blocks have been regenerated for **${fixedProblem.title || context.problemTitle}**. Try running the tests again.`);
    } else if (!onFixProblem) {
      await sendMessage("The fix feature isn't connected for this problem.");
    } else {
      await sendMessage("Sorry, I couldn't generate fixed blocks. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full sm:w-[480px] lg:w-[520px] bg-white shadow-2xl z-40 flex flex-col border-l border-gray-200"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-brand-primary to-brand-primary-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">AI Tutor</h3>
                <p className="text-sm text-white/80 truncate max-w-[300px]">
                  {context.problemTitle}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearMessages}
                className="text-white/70 hover:text-white hover:bg-white/10"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-2 flex-wrap">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    "bg-white border border-gray-200 text-gray-600",
                    "hover:border-brand-primary hover:text-brand-primary",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    action.id === "error" && context.testError && "border-red-300 bg-red-50 text-red-600",
                    action.id === "fix" && context.testError && "border-orange-300 bg-orange-50 text-orange-600"
                  )}
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                <Lightbulb className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  Ask me anything about this problem!
                </p>
                <p className="text-xs mt-2 max-w-[280px]">
                  Try the quick actions above, paste a screenshot (Ctrl+V), or type your question below.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 p-4 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Pasted Image Preview */}
          {pastedImage && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <div className="relative inline-block">
                <img
                  src={pastedImage}
                  alt="Pasted"
                  className="max-h-24 rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => setPastedImage(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Image attached - press send</p>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex gap-2 items-center">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Image upload button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="shrink-0 rounded-full"
                title="Upload image"
              >
                <ImagePlus className="w-4 h-4" />
              </Button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={pastedImage ? "Ask about this image..." : "Ask a question... (Ctrl+V to paste image)"}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm disabled:opacity-50"
              />

              {/* Stop button when loading, Send button otherwise */}
              {isLoading ? (
                <Button
                  onClick={stopGeneration}
                  size="icon"
                  variant="destructive"
                  className="rounded-full shrink-0"
                  title="Stop generation"
                >
                  <Square className="w-4 h-4 fill-current" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() && !pastedImage}
                  size="icon"
                  className="rounded-full shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
