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
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200
            ${
              selectedMood === option.type
                ? "bg-primary-500 text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50"
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
