'use client';

import { useState, useEffect } from 'react';
import { Restaurant, Team, TeamMember } from '@/types';
import TeamHeader from './TeamHeader';
import TeamMemberList from './TeamMemberList';
import TeamRoulette from './TeamRoulette';
import TeamVoteCreate from './TeamVoteCreate';
import TeamVoteActive from './TeamVoteActive';
import TeamCandidateCollector from './TeamCandidateCollector';
import TeamDecision from './TeamDecision';
import { useTeamVote } from '@/hooks/useTeamVote';
import { useTeamSession } from '@/hooks/useTeamSession';
import { supabase } from '@/lib/supabase';

type TeamMode = 'select' | 'collecting' | 'deciding' | 'final-roulette' | 'final-vote' | 'vote-active';

interface TeamDashboardProps {
  team: Team;
  members: TeamMember[];
  userId: string;
  nickname: string;
  restaurants: Restaurant[];
  mapCenter?: { lat: number; lng: number };
  onLeaveTeam: () => void;
  onRefreshMembers: () => void;
  onUpdateAddress?: (address: string, lat: number, lng: number) => Promise<boolean>;
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
  onUpdateAddress,
}: TeamDashboardProps) {
  const [mode, setMode] = useState<TeamMode>('select');
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const { activeVote, isLoading: isVoteLoading, createVote, castVote, closeVote, fetchActiveVote, subscribeToVotes, unsubscribe: unsubscribeVotes } = useTeamVote();
  const {
    session,
    candidates,
    isLoading: isSessionLoading,
    startSession,
    advanceToDeciding,
    closeSession,
    addCandidate,
    removeCandidate,
    subscribeToSession,
    unsubscribe: unsubscribeSession,
    fetchActiveSession,
  } = useTeamSession();

  const hasRestaurants = restaurants.length > 0;

  // 진입 시 활성 투표 + 세션 확인
  useEffect(() => {
    if (team.id && userId) {
      fetchActiveVote(team.id, userId);
      fetchActiveSession(team.id);
      subscribeToVotes(team.id, userId);
      subscribeToSession(team.id);
    }
    return () => {
      unsubscribeVotes();
      unsubscribeSession();
    };
  }, [team.id, userId, fetchActiveVote, subscribeToVotes, unsubscribeVotes, fetchActiveSession, subscribeToSession, unsubscribeSession]);

  // session.status 변경 시 mode 자동 전환
  useEffect(() => {
    if (session) {
      if (session.status === 'collecting' && mode === 'select') {
        setMode('collecting');
      } else if (session.status === 'deciding' && mode === 'collecting') {
        setMode('deciding');
      }
    }
    if (!session && (mode === 'collecting' || mode === 'deciding')) {
      setMode('select');
    }
  }, [session, mode]);

  // 활성 투표가 있으면 자동으로 투표 화면 표시
  useEffect(() => {
    if (activeVote && mode === 'select') {
      setMode('vote-active');
    }
    if (!activeVote && mode === 'vote-active') {
      setMode('select');
    }
  }, [activeVote, mode]);

  // 후보 모으기 시작
  const handleStartCollecting = async () => {
    const newSession = await startSession(team.id, userId);
    if (newSession) {
      setMode('collecting');
    }
  };

  // 다음 단계 (collecting → deciding)
  const handleAdvance = async () => {
    if (!session) return;
    const success = await advanceToDeciding(session.id);
    if (success) {
      setMode('deciding');
    }
  };

  // 취소 (세션 종료)
  const handleCancelSession = async () => {
    if (!session) return;
    await closeSession(session.id);
    setMode('select');
  };

  // 최종 결정: 팀 룰렛
  const handleChooseRoulette = () => {
    setMode('final-roulette');
  };

  // 최종 결정: 팀 투표
  const handleChooseVote = () => {
    setMode('final-vote');
  };

  // 투표 생성 완료
  const handleVoteCreated = async () => {
    if (session) {
      await closeSession(session.id);
    }
    setMode('vote-active');
  };

  // 새 투표
  const handleNewVote = () => {
    setMode('select');
  };

  // 이전 단계 (deciding → collecting)
  const handleBackToCollecting = async () => {
    if (!session) return;
    const { error } = await supabase
      .from('team_sessions')
      .update({ status: 'collecting' })
      .eq('id', session.id);
    if (!error) {
      setMode('collecting');
    }
  };

  // 팀 주소 저장
  const handleSaveAddress = async () => {
    if (!addressInput.trim() || !onUpdateAddress) return;
    setIsAddressLoading(true);
    setAddressError(null);
    try {
      const response = await fetch(`/api/search?address=${encodeURIComponent(addressInput.trim())}&radius=100`);
      const data = await response.json();
      if (!response.ok || !data.center) {
        setAddressError('주소를 찾을 수 없어요. 다시 입력해주세요.');
        return;
      }
      const success = await onUpdateAddress(addressInput.trim(), data.center.lat, data.center.lng);
      if (success) {
        setShowAddressInput(false);
        setAddressInput('');
      } else {
        setAddressError('주소 저장에 실패했어요.');
      }
    } catch {
      setAddressError('주소 검색 중 오류가 발생했어요.');
    } finally {
      setIsAddressLoading(false);
    }
  };

  // 후보 식당만 추출
  const candidateRestaurants = candidates.map((c) => c.restaurant);

  return (
    <div className="space-y-4">
      <TeamHeader team={team} memberCount={members.length} onLeave={onLeaveTeam} />

      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
        <TeamMemberList members={members} currentUserId={userId} />
      </div>

      {/* 회사 주소 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#6B77E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            회사 주소
          </h3>
          <button
            onClick={() => { setShowAddressInput(!showAddressInput); setAddressError(null); }}
            className="text-xs text-[#6B77E8] hover:text-[#5A66D6] font-medium"
          >
            {team.address ? '변경' : '설정'}
          </button>
        </div>
        {team.address ? (
          <p className="text-sm text-gray-600">{team.address}</p>
        ) : (
          <p className="text-xs text-gray-400">주소가 설정되지 않았어요</p>
        )}
        {showAddressInput && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveAddress()}
                placeholder="회사 주소를 입력하세요"
                className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B77E8] focus:ring-1 focus:ring-[#6B77E8]"
              />
              <button
                onClick={handleSaveAddress}
                disabled={isAddressLoading || !addressInput.trim()}
                className="px-4 py-2.5 bg-[#6B77E8] text-white rounded-xl text-sm font-medium hover:bg-[#5A66D6] transition-colors disabled:opacity-50"
              >
                {isAddressLoading ? '...' : '저장'}
              </button>
            </div>
            {addressError && (
              <p className="text-xs text-red-500">{addressError}</p>
            )}
          </div>
        )}
      </div>

      {/* select 모드: 세션 시작 버튼 */}
      {!hasRestaurants && mode === 'select' && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-3">📍</div>
          <p className="text-sm font-medium">주소를 먼저 검색해주세요</p>
          <p className="text-xs mt-1 text-gray-300">주변 맛집 탭에서 회사 주소를 검색하면<br/>팀 기능을 사용할 수 있어요</p>
        </div>
      )}

      {hasRestaurants && mode === 'select' && (
        <div className="text-center">
          <h3 className="text-sm font-bold text-gray-800 mb-3">팀원들과 함께 점심을 정해보세요!</h3>
          <button
            onClick={handleStartCollecting}
            disabled={isSessionLoading}
            className="w-full py-4 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-2xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isSessionLoading ? '시작하는 중...' : '후보 모으기 시작'}
          </button>
          <p className="text-[11px] text-gray-400 mt-2">팀원들이 각자 후보를 추가하고, 룰렛이나 투표로 결정해요</p>
        </div>
      )}

      {/* collecting 모드: 후보 모으기 */}
      {mode === 'collecting' && session && (
        <TeamCandidateCollector
          session={session}
          candidates={candidates}
          members={members}
          userId={userId}
          restaurants={restaurants}
          mapCenter={mapCenter}
          onAddCandidate={addCandidate}
          onRemoveCandidate={removeCandidate}
          onAdvance={handleAdvance}
          onCancel={handleCancelSession}
        />
      )}

      {/* deciding 모드: 최종 결정 */}
      {mode === 'deciding' && (
        <TeamDecision
          candidates={candidates}
          onChooseRoulette={handleChooseRoulette}
          onChooseVote={handleChooseVote}
          onBack={handleBackToCollecting}
        />
      )}

      {/* final-roulette 모드: 후보로만 팀 룰렛 */}
      {mode === 'final-roulette' && (
        <div>
          <button
            onClick={() => setMode('deciding')}
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
            restaurants={candidateRestaurants}
            mapCenter={mapCenter}
          />
        </div>
      )}

      {/* final-vote 모드: 후보로만 투표 생성 */}
      {mode === 'final-vote' && (
        <div>
          <button
            onClick={() => setMode('deciding')}
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
            restaurants={candidateRestaurants}
            preselectedIds={candidateRestaurants.map((r) => r.id)}
            onCreateVote={async (tId, title, rests, uId) => {
              const result = await createVote(tId, title, rests, uId);
              if (result) handleVoteCreated();
              return result;
            }}
            onCancel={() => setMode('deciding')}
          />
        </div>
      )}

      {/* vote-active 모드: 진행 중인 투표 */}
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
