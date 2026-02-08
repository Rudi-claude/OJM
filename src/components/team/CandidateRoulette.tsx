'use client';

import { useState } from 'react';
import { Restaurant } from '@/types';

interface CandidateRouletteProps {
  restaurants: Restaurant[];
  existingCandidateIds: string[];
  onResult: (restaurant: Restaurant) => void;
}

export default function CandidateRoulette({ restaurants, existingCandidateIds, onResult }: CandidateRouletteProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [current, setCurrent] = useState<Restaurant | null>(null);
  const [finalResult, setFinalResult] = useState<Restaurant | null>(null);

  const spin = () => {
    if (restaurants.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setFinalResult(null);

    let count = 0;
    const maxCount = 15;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * restaurants.length);
      setCurrent(restaurants[randomIndex]);
      count++;

      if (count >= maxCount) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * restaurants.length);
        const result = restaurants[finalIndex];
        setCurrent(result);
        setFinalResult(result);
        setIsSpinning(false);
        onResult(result);
      }
    }, 100);
  };

  const isAlreadyCandidate = finalResult ? existingCandidateIds.includes(finalResult.id) : false;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={spin}
          disabled={isSpinning || restaurants.length === 0}
          className={`w-[60px] h-[60px] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all flex-shrink-0 ${
            isSpinning
              ? 'animate-spin bg-[#8B95FF]'
              : 'bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] hover:scale-105 active:scale-95'
          } disabled:opacity-50`}
        >
          {isSpinning ? '🎰' : '🎯'}
        </button>

        <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 min-h-[60px] flex items-center">
          {current ? (
            <div className={isSpinning ? 'animate-pulse w-full' : 'w-full'}>
              <p className="text-sm font-bold text-gray-800 truncate">{current.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] bg-[#F5F6FF] text-[#6B77E8] px-1.5 py-0.5 rounded-full font-medium">{current.category}</span>
                <span className="text-[10px] text-gray-400">{current.distance}m</span>
                {!isSpinning && isAlreadyCandidate && (
                  <span className="text-[10px] text-green-500 font-medium ml-auto">
                    <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    추가됨
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">룰렛을 돌려보세요!</p>
          )}
        </div>
      </div>

      {restaurants.length === 0 && (
        <p className="text-xs text-gray-400 text-center">주소를 먼저 검색해주세요</p>
      )}
    </div>
  );
}
