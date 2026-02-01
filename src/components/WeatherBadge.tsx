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
  clear: "bg-yellow-100 text-yellow-800",
  cloudy: "bg-gray-100 text-gray-800",
  rain: "bg-blue-100 text-blue-800",
  snow: "bg-slate-100 text-slate-800",
  hot: "bg-red-100 text-red-800",
  cold: "bg-cyan-100 text-cyan-800",
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
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
        weatherColors[weather.condition]
      }`}
    >
      <span className="text-lg">{weatherIcons[weather.condition]}</span>
      <span className="text-sm font-medium">{weather.description}</span>
    </div>
  );
}
