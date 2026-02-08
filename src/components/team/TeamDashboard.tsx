'use client';

import { useState, useEffect } from 'react';
import { Restaurant, Team, TeamMember } from '@/types';
import TeamHeader from './TeamHeader';
import TeamMemberList from './TeamMemberList';
import TeamRoulette from './TeamRoulette';
import TeamVoteCreate from './TeamVoteCreate';
import TeamVoteActive from './TeamVoteActive';
import { useTeamVote } from '@/hooks/useTeamVote';

type TeamMode = 'select' | 'roulette' | 'vote-create' | 'vote-active';

interface TeamDashboardProps {
  team: Team;
  members: TeamMember[];
  userId: string;
  nickname: string;
  restaurants: Restaurant[];
  mapCenter?: { lat: number; lng: number };
  onLeaveTeam: () => void;
  onRefreshMembers: () => void;
  preselectedVoteIds?: string[];
  onClearPreselected?: () => void;
}

export default function TeamDashboard({
  team,
  members,
  userId,
  nickname,
  restaurants,
  mapCenter,
  onLeaveTeam,
  onRefreshMembers,
  preselectedVoteIds,
  onClearPreselected,
}: TeamDashboardProps) {
  const [mode, setMode] = useState<TeamMode>('select');
  const { activeVote, isLoading: isVoteLoading, createVote, castVote, closeVote, fetchActiveVote, subscribeToVotes, unsubscribe: unsubscribeVotes } = useTeamVote();

  const hasRestaurants = restaurants.length > 0;

  // 진입 시 활성 투표 확인
  useEffect(() => {
    if (team.id && userId) {
      fetchActiveVote(team.id, userId).then(() => {});
      subscribeToVotes(team.id, userId);
    }
    return () => unsubscribeVotes();
  }, [team.id, userId, fetchActiveVote, subscribeToVotes, unsubscribeVotes]);

  // 활성 투표가 있으면 자동으로 투표 화면 표시
  useEffect(() => {
    if (activeVote && mode === 'select') {
      setMode('vote-active');
    }
    if (!activeVote && mode === 'vote-active') {
      setMode('select');
    }
  }, [activeVote, mode]);

  // 룰렛에서 팀 투표로 넘어온 경우 자동으로 투표 만들기 화면
  useEffect(() => {
    if (preselectedVoteIds && preselectedVoteIds.length > 0) {
      setMode('vote-create');
    }
  }, [preselectedVoteIds]);

  const handleNewVote = () => {
    setMode('vote-create');
  };

  const handleVoteCreated = () => {
    setMode('vote-active');
  };

  return (
    <div className="space-y-4">
      <TeamHeader team={team} memberCount={members.length} onLeave={onLeaveTeam} />

      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
        <TeamMemberList members={members} currentUserId={userId} />
      </div>

      {!hasRestaurants && mode === 'select' && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-3">📍</div>
          <p className="text-sm font-medium">주소를 먼저 검색해주세요</p>
          <p className="text-xs mt-1 text-gray-300">주변 맛집 탭에서 회사 주소를 검색하면<br/>팀 룰렛과 투표를 사용할 수 있어요</p>
        </div>
      )}

      {hasRestaurants && mode === 'select' && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 text-center mb-3">어떤 기능을 사용할까요?</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('roulette')}
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
              onClick={() => setMode('vote-create')}
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
      )}

      {mode === 'roulette' && (
        <div>
          <button
            onClick={() => setMode('select')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#6B77E8] mb-3 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            돌아가기
          </button>
          <TeamRoulette
            teamId={team.id}
            userId={userId}
            nickname={nickname}
            restaurants={restaurants}
            mapCenter={mapCenter}
          />
        </div>
      )}

      {mode === 'vote-create' && (
        <div>
          <button
            onClick={() => setMode('select')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#6B77E8] mb-3 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            돌아가기
          </button>
          <TeamVoteCreate
            teamId={team.id}
            userId={userId}
            restaurants={restaurants}
            preselectedIds={preselectedVoteIds}
            onCreateVote={async (tId, title, rests, uId) => {
              const result = await createVote(tId, title, rests, uId);
              if (result) handleVoteCreated();
              onClearPreselected?.();
              return result;
            }}
            onCancel={() => { setMode('select'); onClearPreselected?.(); }}
          />
        </div>
      )}

      {mode === 'vote-active' && activeVote && (
        <div>
          <button
            onClick={() => setMode('select')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#6B77E8] mb-3 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            돌아가기
          </button>
          <TeamVoteActive
            vote={activeVote}
            userId={userId}
            mapCenter={mapCenter}
            onCastVote={castVote}
            onCloseVote={closeVote}
            onNewVote={handleNewVote}
          />
        </div>
      )}
    </div>
  );
}
