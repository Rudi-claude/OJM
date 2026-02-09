'use client';

import { useEffect, useState } from 'react';
import { Restaurant } from '@/types';
import { useTeamRoulette } from '@/hooks/useTeamRoulette';

interface TeamRouletteProps {
  teamId: string;
  userId: string;
  nickname: string;
  restaurants: Restaurant[];
  mapCenter?: { lat: number; lng: number };
  onTeamMealLog?: (restaurant: Restaurant) => void;
}

export default function TeamRoulette({ teamId, userId, nickname, restaurants, mapCenter, onTeamMealLog }: TeamRouletteProps) {
  const { displayRestaurant, isSpinning, spinnerName, startRoulette, subscribeToRoulette, unsubscribe } = useTeamRoulette();
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    subscribeToRoulette(teamId);
    return () => unsubscribe();
  }, [teamId, subscribeToRoulette, unsubscribe]);

  const handleSpin = () => {
    startRoulette(restaurants, userId, nickname, teamId);
  };

  const getDirectionsUrl = () => {
    if (!displayRestaurant || !mapCenter) return null;
    const x = displayRestaurant.x || displayRestaurant.longitude;
    const y = displayRestaurant.y || displayRestaurant.latitude;
    if (!x || !y) return null;
    return `https://map.kakao.com/link/from/우리회사,${mapCenter.lat},${mapCenter.lng}/to/${encodeURIComponent(displayRestaurant.name)},${y},${x}`;
  };

  const handleShare = async () => {
    if (!displayRestaurant) return;
    const shareText = `오점뭐? 팀 룰렛 결과: ${displayRestaurant.name}(${displayRestaurant.category}) - ${displayRestaurant.distance}m${displayRestaurant.placeUrl ? `\n카카오맵: ${displayRestaurant.placeUrl}` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: '오점뭐? 팀 룰렛 결과', text: shareText });
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

  return (
    <div className="w-full text-center">
      <div className="bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] rounded-2xl p-6 shadow-2xl shadow-[#6B77E8]/20">
        <h2 className="text-white text-lg font-bold mb-1">팀 룰렛</h2>
        <p className="text-white/70 text-xs mb-4">팀원 모두 같은 결과를 봐요</p>

        {/* 결과 표시 영역 */}
        <div className="bg-white rounded-2xl p-5 mb-5 min-h-[120px] flex flex-col items-center justify-center shadow-inner">
          {displayRestaurant ? (
            <div className={isSpinning ? 'animate-pulse' : 'w-full'}>
              <p className="text-xl font-bold text-gray-800">{displayRestaurant.name}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs bg-[#F5F6FF] text-[#6B77E8] px-2.5 py-1 rounded-full font-medium">
                  {displayRestaurant.category}
                </span>
                <span className="text-xs text-gray-400">직선 {displayRestaurant.distance}m</span>
              </div>
              {!isSpinning && spinnerName && (
                <>
                  <p className="text-xs text-gray-500 mt-2">
                    {spinnerName}님이 돌린 결과
                  </p>
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
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      {shareStatus || '공유'}
                    </button>
                    {onTeamMealLog && (
                      <button
                        onClick={() => onTeamMealLog(displayRestaurant!)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        먹었어요
                      </button>
                    )}
                  </div>
                </>
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
          onClick={handleSpin}
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
          <p className="text-white/70 text-xs mt-4">주변 맛집 탭에서 주소를 먼저 검색해주세요</p>
        )}
      </div>
    </div>
  );
}
