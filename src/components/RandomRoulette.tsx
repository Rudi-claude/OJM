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

    // 룰렛 효과: 빠르게 여러 개를 보여주다가 멈춤
    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * restaurants.length);
      setSelected(restaurants[randomIndex]);
      count++;

      if (count >= maxCount) {
        clearInterval(interval);
        // 최종 선택
        const finalIndex = Math.floor(Math.random() * restaurants.length);
        const finalRestaurant = restaurants[finalIndex];
        setSelected(finalRestaurant);
        setIsSpinning(false);
        onSelect?.(finalRestaurant);
      }
    }, 100);
  };

  // 맛집 목록이 바뀌면 선택 초기화
  useEffect(() => {
    setSelected(null);
    onSelect?.(null);
  }, [restaurants]);

  // 도보 시간 계산 (분당 약 67m 기준)
  const walkingTime = selected ? Math.ceil(selected.distance / 67) : 0;

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-8 shadow-xl">
        <h2 className="text-white text-xl font-bold mb-4">오늘 뭐 먹지?</h2>

        {/* 결과 표시 영역 */}
        <div className="bg-white rounded-xl p-6 mb-6 min-h-[100px] flex items-center justify-center">
          {selected ? (
            <div className={isSpinning ? 'animate-pulse' : ''}>
              <p className="text-2xl font-bold text-gray-800">{selected.name}</p>
              <p className="text-sm text-gray-500 mt-1">{selected.category} · {selected.distance}m</p>
              {!isSpinning && (
                <p className="text-sm text-orange-500 mt-2 font-medium">
                  🚶 도보 약 {walkingTime}분
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-400">버튼을 눌러 돌려보세요!</p>
          )}
        </div>

        {/* 룰렛 버튼 */}
        <button
          onClick={spin}
          disabled={isSpinning || restaurants.length === 0}
          className={`w-32 h-32 rounded-full text-white font-bold text-lg shadow-lg transition-transform ${
            isSpinning
              ? 'animate-spin bg-gray-400'
              : 'bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-105 active:scale-95'
          } disabled:opacity-50`}
        >
          {isSpinning ? '돌리는 중...' : '돌리기!'}
        </button>

        {restaurants.length === 0 && (
          <p className="text-white/80 text-sm mt-4">먼저 주소를 검색해주세요</p>
        )}
      </div>
    </div>
  );
}
