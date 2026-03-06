// ============================================================
// MaatWork CRM — AI Copilot Sidebar
// UI/UX REFINED BY JULES v2
// ============================================================

import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronRight, Send, Sparkles, User, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { Button } from "./Button";

interface AICopilotProps {
  open: boolean;
  onClose: () => void;
}

export function AICopilot({ open, onClose }: AICopilotProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi there! I'm your MaatWork AI Copilot. I can help you summarize contacts, draft emails, or predict deal close dates. How can I assist you today?",
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm analyzing your request. As an AI Copilot stub, I don't have real backend connectivity yet, but in the future, I'll provide deep insights into your CRM data!",
        },
      ]);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/20 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-surface/95 backdrop-blur-3xl border-l border-border shadow-[-20px_0_50px_rgba(0,0,0,0.3)] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/50 bg-surface-hover/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text font-display tracking-tight">AI Copilot</h2>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Online & Ready
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-lg text-text-muted hover:text-text hover:bg-surface"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Suggested Actions */}
            <div className="p-4 border-b border-border/30 bg-surface-hover/20 overflow-x-auto scrollbar-hide flex gap-2">
              {["Summarize Pipeline", "Draft Follow-up", "Analyze Win Rate"].map((action) => (
                <button
                  key={action}
                  onClick={() => setInput(action)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-text-secondary hover:text-primary hover:border-primary/30 transition-all flex items-center gap-1.5"
                >
                  {action} <ChevronRight className="w-3 h-3 opacity-50" />
                </button>
              ))}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={cn("flex gap-3 max-w-[90%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1",
                      msg.role === "user"
                        ? "bg-surface-hover border border-border text-text-secondary"
                        : "bg-primary/10 border border-primary/20 text-primary",
                    )}
                  >
                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-surface-hover border border-border text-text rounded-tr-sm"
                        : "bg-primary/5 border border-primary/10 text-text-secondary rounded-tl-sm",
                    )}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-border/50 bg-surface-hover/50">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Copilot anything..."
                  className="w-full pl-4 pr-12 py-3.5 bg-surface border border-border rounded-xl text-sm font-medium text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
              <p className="text-center text-[10px] text-text-muted mt-3 font-medium">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
