'use client';

import { TeamVote } from '@/types';

interface TeamVoteActiveProps {
  vote: TeamVote;
  userId: string;
  mapCenter?: { lat: number; lng: number };
  onCastVote: (voteId: string, optionId: string, userId: string) => Promise<boolean>;
  onCloseVote: (voteId: string) => Promise<boolean>;
  onNewVote: () => void;
  onTeamMealLog?: (restaurant: { id: string; name: string; category: string }) => void;
}

export default function TeamVoteActive({ vote, userId, mapCenter, onCastVote, onCloseVote, onNewVote, onTeamMealLog }: TeamVoteActiveProps) {
  const isCreator = vote.createdBy === userId;
  const isClosed = vote.status === 'closed';
  const totalVotes = vote.options.reduce((sum, o) => sum + o.pickCount, 0);

  // 1등 찾기
  const maxPicks = Math.max(...vote.options.map((o) => o.pickCount));
  const winnerId = isClosed && maxPicks > 0
    ? vote.options.find((o) => o.pickCount === maxPicks)?.id
    : null;

  const handleVote = async (optionId: string) => {
    if (isClosed) return;
    await onCastVote(vote.id, optionId, userId);
  };

  const handleClose = async () => {
    await onCloseVote(vote.id);
  };

  const getDirectionsUrl = (option: typeof vote.options[0]) => {
    if (!mapCenter || !option.restaurant.placeUrl) return option.restaurant.placeUrl;
    return option.restaurant.placeUrl;
  };

  return (
    <div className="space-y-3">
      {/* 투표 헤더 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{vote.title}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isClosed ? '마감됨' : '진행 중'} · 총 {totalVotes}표
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full text-[10px] font-medium ${
            isClosed
              ? 'bg-gray-100 text-gray-500'
              : 'bg-green-50 text-green-600'
          }`}>
            {isClosed ? '마감' : '투표 중'}
          </div>
        </div>
      </div>

      {/* 옵션 목록 */}
      <div className="space-y-2">
        {vote.options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.pickCount / totalVotes) * 100) : 0;
          const isWinner = option.id === winnerId;
          const isMyPick = option.pickedByMe;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={isClosed}
              className={`w-full text-left p-3 rounded-xl transition-all relative overflow-hidden ${
                isWinner
                  ? 'bg-[#F5F6FF] border-2 border-[#6B77E8] shadow-sm'
                  : isMyPick
                  ? 'bg-white border-2 border-[#6B77E8]/40'
                  : 'bg-white border border-gray-100 hover:border-gray-200'
              } ${isClosed ? '' : 'active:scale-[0.98]'}`}
            >
              {/* 투표 바 배경 */}
              <div
                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                  isWinner ? 'bg-[#6B77E8]/10' : 'bg-gray-100/50'
                }`}
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isWinner && <span className="text-sm">🏆</span>}
                    <p className={`text-sm font-bold truncate ${isWinner ? 'text-[#6B77E8]' : 'text-gray-800'}`}>
                      {option.restaurant.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400">{option.restaurant.category}</span>
                    {option.restaurant.distance && (
                      <span className="text-[10px] text-gray-400">{option.restaurant.distance}m</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-gray-600">{option.pickCount}표</span>
                  <span className="text-[10px] text-gray-400 w-8 text-right">{percentage}%</span>
                  {isMyPick && (
                    <div className="w-4 h-4 rounded-full bg-[#6B77E8] flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 1등 길찾기 (마감 시) */}
      {isClosed && winnerId && (
        <div className="bg-[#F5F6FF] rounded-xl p-3 text-center">
          {(() => {
            const winner = vote.options.find((o) => o.id === winnerId);
            if (!winner) return null;
            const url = getDirectionsUrl(winner);
            return (
              <div>
                <p className="text-xs text-[#6B77E8] font-medium mb-2">
                  오늘의 점심은 <span className="font-bold">{winner.restaurant.name}</span>!
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl text-xs font-semibold hover:shadow-lg transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      카카오맵에서 보기
                    </a>
                  )}
                  {onTeamMealLog && (
                    <button
                      onClick={() => onTeamMealLog({
                        id: winner.restaurant.id,
                        name: winner.restaurant.name,
                        category: winner.restaurant.category || '기타',
                      })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      먹었어요
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        {isCreator && !isClosed && (
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
          >
            투표 마감
          </button>
        )}
        {isClosed && (
          <button
            onClick={onNewVote}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
          >
            새 투표 만들기
          </button>
        )}
      </div>
    </div>
  );
}
