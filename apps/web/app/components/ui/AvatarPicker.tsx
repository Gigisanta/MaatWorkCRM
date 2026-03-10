// ============================================================
// AvatarPicker Component - Emoji/Initial avatar selector
// ============================================================

import { motion } from "framer-motion";
import { useState } from "react";

interface AvatarPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  size?: "sm" | "md" | "lg";
}

const EMOJI_OPTIONS = [
  "👤",
  "👨",
  "👩",
  "🧑",
  "👨\u200d💼",
  "👩\u200d💼",
  "🧑\u200d💼",
  "👨\u200d💻",
  "👩\u200d💻",
  "🧑\u200d💻",
  "👨\u200d🎓",
  "👩\u200d🎓",
  "🦸",
  "🦹",
  "🧙",
  "🧝",
  "🧛",
  "🧟",
  "🐶",
  "🐱",
  "🦊",
  "🐼",
  "🦁",
  "🐯",
  "⭐",
  "🌟",
  "💫",
  "🔥",
  "💎",
  "🎯",
  "🚀",
  "✈️",
  "⚡",
  "💡",
  "🎨",
  "🎭",
];

export function AvatarPicker({ value, onChange, size = "md" }: AvatarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-lg",
    lg: "w-14 h-14 text-2xl",
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-[#8B5CF6]/30 to-transparent flex items-center justify-center text-white font-black border border-white/10 hover:from-[#8B5CF6]/50 transition-all`}
      >
        {value}
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-50 mt-2 p-2 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto w-48"
        >
          <div className="grid grid-cols-6 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setIsOpen(false);
                }}
                className={`w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-white/10 transition-colors ${
                  value === emoji ? "bg-white/20" : ""
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Simple Avatar display component
interface AvatarProps {
  emoji?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}

export function Avatar({ emoji, name, size = "md", showStatus }: AvatarProps) {
  const displayValue = emoji || name?.charAt(0) || "👤";

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-lg",
    lg: "w-14 h-14 text-2xl",
  };

  return (
    <div className="relative">
      <div
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-[#8B5CF6]/30 to-transparent flex items-center justify-center text-white font-black border border-white/10`}
      >
        {displayValue}
      </div>
      {showStatus && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#22C55E] border-2 border-[#0F0F0F] flex items-center justify-center">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  );
}
