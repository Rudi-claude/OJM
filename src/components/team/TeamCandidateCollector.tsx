'use client';

import { useState } from 'react';
import { Restaurant, TeamSession, TeamCandidate, TeamMember, CandidateSource } from '@/types';
import CandidateRoulette from './CandidateRoulette';
import CandidateManualPick from './CandidateManualPick';
import CandidateAIRecommend from './CandidateAIRecommend';

type AddMethod = 'roulette' | 'manual' | 'ai' | null;

interface TeamCandidateCollectorProps {
  session: TeamSession;
  candidates: TeamCandidate[];
  members: TeamMember[];
  userId: string;
  restaurants: Restaurant[];
  mapCenter?: { lat: number; lng: number };
  onAddCandidate: (sessionId: string, restaurant: Restaurant, userId: string, source: CandidateSource) => Promise<boolean>;
  onRemoveCandidate: (candidateId: string) => Promise<boolean>;
  onAdvance: () => void;
  onCancel: () => void;
}

export default function TeamCandidateCollector({
  session,
  candidates,
  members,
  userId,
  restaurants,
  mapCenter,
  onAddCandidate,
  onRemoveCandidate,
  onAdvance,
  onCancel,
}: TeamCandidateCollectorProps) {
  const [activeMethod, setActiveMethod] = useState<AddMethod>(null);

  const existingCandidateIds = candidates.map((c) => c.restaurant.id);

  const getNickname = (uid: string | null) => {
    if (!uid) return '알 수 없음';
    const member = members.find((m) => m.userId === uid);
    return member?.nickname || '팀원';
  };

  const getSourceIcon = (source: CandidateSource) => {
    switch (source) {
      case 'roulette': return '🎰';
      case 'manual': return '✋';
      case 'ai': return '🤖';
    }
  };

  const handleRouletteResult = async (restaurant: Restaurant) => {
    await onAddCandidate(session.id, restaurant, userId, 'roulette');
  };

  const handleManualPick = async (restaurant: Restaurant) => {
    await onAddCandidate(session.id, restaurant, userId, 'manual');
  };

  const handleAIPick = async (restaurant: Restaurant) => {
    await onAddCandidate(session.id, restaurant, userId, 'ai');
  };

  const canAdvance = candidates.length >= 2;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-800">후보 모으기</h3>
          <span className="px-2 py-0.5 bg-[#6B77E8] text-white text-[11px] font-bold rounded-full">
            {candidates.length}개
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onAdvance}
            disabled={!canAdvance}
            className="px-4 py-1.5 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white text-xs font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-40"
          >
            다음 단계
          </button>
        </div>
      </div>

      {/* 후보 리스트 */}
      {candidates.length > 0 ? (
        <div className="space-y-1.5">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-gray-100"
            >
              <span className="text-base flex-shrink-0">{getSourceIcon(c.source)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{c.restaurant.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{c.restaurant.category}</span>
                  <span className="text-[10px] text-gray-400">{c.restaurant.distance}m</span>
                  <span className="text-[10px] text-[#8B95FF]">{getNickname(c.addedBy)}</span>
                </div>
              </div>
              {c.addedBy === userId && (
                <button
                  onClick={() => onRemoveCandidate(c.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-400 transition-colors text-xs"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400">
          <p className="text-xs">아직 후보가 없어요. 아래 방법으로 추가해보세요!</p>
        </div>
      )}

      {!canAdvance && candidates.length > 0 && (
        <p className="text-[11px] text-amber-500 text-center">최소 2개 이상의 후보가 필요해요</p>
      )}

      {/* 추가 방법 3버튼 */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setActiveMethod(activeMethod === 'roulette' ? null : 'roulette')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
            activeMethod === 'roulette'
              ? 'border-[#6B77E8] bg-[#F5F6FF]'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <span className="text-xl">🎰</span>
          <span className="text-[11px] font-medium text-gray-700">룰렛</span>
        </button>
        <button
          onClick={() => setActiveMethod(activeMethod === 'manual' ? null : 'manual')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
            activeMethod === 'manual'
              ? 'border-[#6B77E8] bg-[#F5F6FF]'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <span className="text-xl">✋</span>
          <span className="text-[11px] font-medium text-gray-700">직접 선택</span>
        </button>
        <button
          onClick={() => setActiveMethod(activeMethod === 'ai' ? null : 'ai')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
            activeMethod === 'ai'
              ? 'border-[#6B77E8] bg-[#F5F6FF]'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <span className="text-xl">🤖</span>
          <span className="text-[11px] font-medium text-gray-700">AI 추천</span>
        </button>
      </div>

      {/* 선택된 방법의 서브 컴포넌트 */}
      {activeMethod === 'roulette' && (
        <div className="bg-gray-50 rounded-xl p-3">
          <CandidateRoulette
            restaurants={restaurants}
            existingCandidateIds={existingCandidateIds}
            onResult={handleRouletteResult}
          />
        </div>
      )}

      {activeMethod === 'manual' && (
        <div className="bg-gray-50 rounded-xl p-3">
          <CandidateManualPick
            restaurants={restaurants}
            existingCandidateIds={existingCandidateIds}
            onPick={handleManualPick}
          />
        </div>
      )}

      {activeMethod === 'ai' && (
        <div className="bg-gray-50 rounded-xl p-3">
          <CandidateAIRecommend
            restaurants={restaurants}
            mapCenter={mapCenter}
            existingCandidateIds={existingCandidateIds}
            onPick={handleAIPick}
          />
        </div>
      )}
    </div>
  );
}
