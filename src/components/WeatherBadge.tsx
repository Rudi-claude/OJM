"use client";

import type { WeatherData, WeatherCondition } from "@/types";

interface WeatherBadgeProps {
  weather: WeatherData | null;
  isLoading?: boolean;
}

const weatherIcons: Record<WeatherCondition, string> = {
  clear: "☀️",
  cloudy: "⛅",
  rain: "🌧️",
  snow: "❄️",
  hot: "🥵",
  cold: "🥶",
};

const weatherColors: Record<WeatherCondition, string> = {
  clear: "bg-amber-50 text-amber-700 border border-amber-200",
  cloudy: "bg-gray-50 text-gray-700 border border-gray-200",
  rain: "bg-blue-50 text-blue-700 border border-blue-200",
  snow: "bg-slate-50 text-slate-700 border border-slate-200",
  hot: "bg-rose-50 text-rose-700 border border-rose-200",
  cold: "bg-cyan-50 text-cyan-700 border border-cyan-200",
};

export default function WeatherBadge({ weather, isLoading }: WeatherBadgeProps) {
  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-sm ${
        weatherColors[weather.condition]
      }`}
    >
      <span className="text-base">{weatherIcons[weather.condition]}</span>
      <span className="text-xs font-medium">{weather.temperature}°</span>
    </div>
  );
}
