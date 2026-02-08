'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/types';

interface RandomRouletteProps {
  restaurants: Restaurant[];
  onSelect?: (restaurant: Restaurant | null) => void;
  mapCenter?: { lat: number; lng: number };
  onMealLog?: (restaurant: Restaurant) => void;
  onTeamCandidate?: (restaurant: Restaurant) => void;
}

export default function RandomRoulette({ restaurants, onSelect, mapCenter, onMealLog, onTeamCandidate }: RandomRouletteProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const spin = () => {
    if (restaurants.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelected(null);
    onSelect?.(null);
    setShareStatus(null);

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

  // restaurants 내용이 실제로 바뀌었을 때만 선택 초기화
  const restaurantIds = restaurants.map((r) => r.id).join(',');
  useEffect(() => {
    setSelected(null);
    onSelect?.(null);
  }, [restaurantIds]);

  const getDirectionsUrl = () => {
    if (!selected || !mapCenter || !selected.x || !selected.y) return null;
    return `https://map.kakao.com/link/from/우리회사,${mapCenter.lat},${mapCenter.lng}/to/${encodeURIComponent(selected.name)},${selected.y},${selected.x}`;
  };

  const handleShare = async () => {
    if (!selected) return;

    const shareText = `오점뭐? 오늘 점심은 ${selected.name}(${selected.category}) - ${selected.distance}m${selected.placeUrl ? `\n카카오맵: ${selected.placeUrl}` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '오점뭐? 오늘의 점심',
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await copyToClipboard(shareText);
        }
      }
    } else {
      await copyToClipboard(shareText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareStatus('복사 완료!');
      setTimeout(() => setShareStatus(null), 2000);
    } catch {
      setShareStatus('복사 실패');
      setTimeout(() => setShareStatus(null), 2000);
    }
  };

  const handleMealLog = () => {
    if (selected) {
      onMealLog?.(selected);
    }
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
              {!isSpinning && (
                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                  {getDirectionsUrl() && (
                    <a
                      href={getDirectionsUrl()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl text-xs font-semibold hover:shadow-lg transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      길찾기
                    </a>
                  )}
                  {onMealLog && (
                    <button
                      onClick={handleMealLog}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 text-white rounded-xl text-xs font-semibold hover:bg-amber-500 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      여기서 먹었어요
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {shareStatus || '공유'}
                  </button>
                  {onTeamCandidate && (
                    <button
                      onClick={() => onTeamCandidate(selected!)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F5F6FF] text-[#6B77E8] rounded-xl text-xs font-semibold hover:bg-[#E8EAFF] transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      팀 후보에 추가
                    </button>
                  )}
                </div>
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
