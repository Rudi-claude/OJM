'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/types';

interface RandomRouletteProps {
  restaurants: Restaurant[];
  onSelect?: (restaurant: Restaurant | null) => void;
  mapCenter?: { lat: number; lng: number };
}

export default function RandomRoulette({ restaurants, onSelect, mapCenter }: RandomRouletteProps) {
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

  const getDirectionsUrl = () => {
    if (!selected || !mapCenter || !selected.x || !selected.y) return null;
    return `https://map.kakao.com/link/from/우리회사,${mapCenter.lat},${mapCenter.lng}/to/${encodeURIComponent(selected.name)},${selected.y},${selected.x}`;
  };

  return (
    <div className="w-full text-center">
      <div className="bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] rounded-2xl p-6 shadow-2xl shadow-[#6B77E8]/20">
        <h2 className="text-white text-lg font-bold mb-1">오늘의 점심은?</h2>
        <p className="text-white/70 text-xs mb-4">룰렛을 돌려 맛집을 선택하세요</p>

        {/* 결과 표시 영역 */}
        <div className="bg-white rounded-2xl p-5 mb-5 min-h-[120px] flex flex-col items-center justify-center shadow-inner">
          {selected ? (
            <div className={isSpinning ? 'animate-pulse' : 'w-full'}>
              <p className="text-xl font-bold text-gray-800">{selected.name}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs bg-[#F5F6FF] text-[#6B77E8] px-2.5 py-1 rounded-full font-medium">
                  {selected.category}
                </span>
                <span className="text-xs text-gray-400">직선 {selected.distance}m</span>
              </div>
              {!isSpinning && getDirectionsUrl() && (
                <a
                  href={getDirectionsUrl()!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-2 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl text-xs font-semibold hover:shadow-lg transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  도보 길찾기
                </a>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-3xl mb-1.5">🎲</div>
              <p className="text-sm text-gray-400">버튼을 눌러 돌려보세요!</p>
            </div>
          )}
        </div>

        {/* 룰렛 버튼 */}
        <button
          onClick={spin}
          disabled={isSpinning || restaurants.length === 0}
          className={`w-28 h-28 rounded-full text-white font-bold text-base shadow-xl transition-all duration-300 ${
            isSpinning
              ? 'animate-spin bg-white/20'
              : 'bg-white/20 backdrop-blur hover:scale-105 hover:bg-white/30 active:scale-95 border-4 border-white/30'
          } disabled:opacity-50`}
        >
          {isSpinning ? (
            <span className="text-lg">🎰</span>
          ) : (
            <div>
              <span className="text-2xl block mb-0.5">🎯</span>
              <span className="text-sm">돌리기</span>
            </div>
          )}
        </button>

        {restaurants.length === 0 && (
          <p className="text-white/70 text-xs mt-4">먼저 주소를 검색해주세요</p>
        )}
      </div>
    </div>
  );
}
