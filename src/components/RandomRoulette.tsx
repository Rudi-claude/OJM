'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/types';

interface RandomRouletteProps {
  restaurants: Restaurant[];
  onSelect?: (restaurant: Restaurant | null) => void;
}

export default function RandomRoulette({ restaurants, onSelect }: RandomRouletteProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const spin = () => {
    if (restaurants.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelected(null);
    onSelect?.(null);

    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * restaurants.length);
      setSelected(restaurants[randomIndex]);
      count++;

      if (count >= maxCount) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * restaurants.length);
        const finalRestaurant = restaurants[finalIndex];
        setSelected(finalRestaurant);
        setIsSpinning(false);
        onSelect?.(finalRestaurant);
      }
    }, 100);
  };

  useEffect(() => {
    setSelected(null);
    onSelect?.(null);
  }, [restaurants]);

  const walkingTime = selected ? Math.ceil(selected.distance / 67) : 0;

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] rounded-3xl p-8 shadow-2xl shadow-[#6B77E8]/20">
        <h2 className="text-white text-xl font-bold mb-2">오늘의 점심은?</h2>
        <p className="text-white/70 text-sm mb-6">룰렛을 돌려 맛집을 선택하세요</p>

        {/* 결과 표시 영역 */}
        <div className="bg-white rounded-2xl p-6 mb-6 min-h-[120px] flex items-center justify-center shadow-inner">
          {selected ? (
            <div className={isSpinning ? 'animate-pulse' : ''}>
              <p className="text-2xl font-bold text-gray-800">{selected.name}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-sm bg-[#F5F6FF] text-[#6B77E8] px-3 py-1 rounded-full font-medium">
                  {selected.category}
                </span>
                <span className="text-sm text-gray-400">{selected.distance}m</span>
              </div>
              {!isSpinning && (
                <p className="text-sm text-[#6B77E8] mt-3 font-medium flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  도보 약 {walkingTime}분
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-2">🎲</div>
              <p className="text-gray-400">버튼을 눌러 돌려보세요!</p>
            </div>
          )}
        </div>

        {/* 룰렛 버튼 */}
        <button
          onClick={spin}
          disabled={isSpinning || restaurants.length === 0}
          className={`w-36 h-36 rounded-full text-white font-bold text-lg shadow-xl transition-all duration-300 ${
            isSpinning
              ? 'animate-spin bg-white/20'
              : 'bg-white/20 backdrop-blur hover:scale-105 hover:bg-white/30 active:scale-95 border-4 border-white/30'
          } disabled:opacity-50`}
        >
          {isSpinning ? (
            <span className="text-xl">🎰</span>
          ) : (
            <div>
              <span className="text-3xl block mb-1">🎯</span>
              <span>돌리기</span>
            </div>
          )}
        </button>

        {restaurants.length === 0 && (
          <p className="text-white/70 text-sm mt-6">먼저 주소를 검색해주세요</p>
        )}
      </div>
    </div>
  );
}
