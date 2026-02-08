'use client';

import { TeamCandidate } from '@/types';

interface TeamDecisionProps {
  candidates: TeamCandidate[];
  onChooseRoulette: () => void;
  onChooseVote: () => void;
  onBack: () => void;
}

export default function TeamDecision({ candidates, onChooseRoulette, onChooseVote, onBack }: TeamDecisionProps) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">최종 결정</h3>
        <button
          onClick={onBack}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          이전 단계
        </button>
      </div>

      {/* 후보 요약 */}
      <div className="bg-white rounded-xl p-3 border border-gray-100">
        <p className="text-xs text-gray-500 font-medium mb-2">모인 후보 ({candidates.length}개)</p>
        <div className="space-y-1.5">
          {candidates.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2 py-1.5">
              <span className="text-xs font-bold text-[#6B77E8] w-5 text-center">{i + 1}</span>
              <span className="text-sm font-medium text-gray-800 truncate flex-1">{c.restaurant.name}</span>
              <span className="text-[10px] text-gray-400">{c.restaurant.category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 결정 방법 2버튼 */}
      <div>
        <p className="text-xs text-gray-500 font-medium text-center mb-3">어떻게 결정할까요?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onChooseRoulette}
            className="flex flex-col items-center gap-2.5 p-5 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#6B77E8] hover:shadow-lg transition-all group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-[#6B77E8]/20 group-hover:scale-110 transition-transform">
              🎰
            </div>
            <div className="text-center">
              <p className="font-bold text-sm text-gray-800">팀 룰렛</p>
              <p className="text-[11px] text-gray-400 mt-0.5">같이 돌리기!</p>
            </div>
          </button>

          <button
            onClick={onChooseVote}
            className="flex flex-col items-center gap-2.5 p-5 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#6B77E8] hover:shadow-lg transition-all group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-[#6B77E8]/20 group-hover:scale-110 transition-transform">
              🗳️
            </div>
            <div className="text-center">
              <p className="font-bold text-sm text-gray-800">팀 투표</p>
              <p className="text-[11px] text-gray-400 mt-0.5">다수결로!</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
