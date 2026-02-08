"use client";

import { useState } from "react";
import type { ScoredRestaurant } from "@/types";

interface RecommendCardProps {
  restaurants: ScoredRestaurant[];
  currentIndex?: number;
  onAte?: (restaurant: ScoredRestaurant) => void;
  onNext?: () => void;
  onTeamCandidate?: (restaurant: ScoredRestaurant) => void;
  isLoading?: boolean;
}

export default function RecommendCard({
  restaurants,
  currentIndex = 0,
  onAte,
  onNext,
  onTeamCandidate,
  isLoading,
}: RecommendCardProps) {
  const [isAteLoading, setIsAteLoading] = useState(false);

  if (restaurants.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500">
        추천할 식당을 찾지 못했어요
      </div>
    );
  }

  const restaurant = restaurants[currentIndex];
  const hasMore = currentIndex < restaurants.length - 1;

  const handleAte = async () => {
    if (!onAte || isAteLoading) return;
    setIsAteLoading(true);
    try {
      await onAte(restaurant);
    } finally {
      setIsAteLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{restaurant.name}</h3>
            <span className="inline-block px-3 py-1 mt-1 text-xs font-medium bg-[#F5F6FF] text-[#6B77E8] rounded-full">
              {restaurant.category}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#6B77E8]">
              {restaurant.score}
              <span className="text-sm font-normal text-gray-400">점</span>
            </div>
            {restaurant.distance !== undefined && (
              <span className="text-xs text-gray-500">
                {restaurant.distance < 1000
                  ? `${restaurant.distance}m`
                  : `${(restaurant.distance / 1000).toFixed(1)}km`}
              </span>
            )}
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-600">{restaurant.address}</p>

        {restaurant.reasons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {restaurant.reasons.map((reason, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {reason}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex border-t border-gray-100">
        <button
          onClick={handleAte}
          disabled={isAteLoading || isLoading}
          className="flex-1 px-4 py-3 text-sm font-semibold text-[#6B77E8] hover:bg-[#F5F6FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAteLoading ? "저장 중..." : "먹었어!"}
        </button>
        {onTeamCandidate && (
          <>
            <div className="w-px bg-gray-100" />
            <button
              onClick={() => onTeamCandidate(restaurant)}
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-sm font-medium text-[#6B77E8] hover:bg-[#F5F6FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              팀 후보에 추가
            </button>
          </>
        )}
        {hasMore && (
          <>
            <div className="w-px bg-gray-100" />
            <button
              onClick={onNext}
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다른 거 ({restaurants.length - currentIndex - 1}개 더)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
