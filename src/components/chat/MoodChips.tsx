"use client";

import { MOOD_OPTIONS, type MoodType } from "@/types";

interface MoodChipsProps {
  onSelect: (mood: MoodType) => void;
  disabled?: boolean;
  selectedMood?: MoodType;
}

export default function MoodChips({
  onSelect,
  disabled,
  selectedMood,
}: MoodChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOOD_OPTIONS.map((option) => (
        <button
          key={option.type}
          onClick={() => onSelect(option.type)}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
            transition-all duration-200
            ${
              selectedMood === option.type
                ? "bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white shadow-lg shadow-[#6B77E8]/20"
                : "bg-white border border-gray-100 text-gray-700 hover:border-[#8B95FF] hover:bg-[#F5F6FF] hover:text-[#6B77E8]"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
