'use client';

import { useState, useEffect, useRef } from 'react';
import { Restaurant, Team, TeamMember } from '@/types';
import TeamHeader from './TeamHeader';
import TeamMemberList from './TeamMemberList';
import TeamRoulette from './TeamRoulette';
import TeamVoteCreate from './TeamVoteCreate';
import TeamVoteActive from './TeamVoteActive';
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
  mapCenter?: { lat: number; lng: number };
  onLeaveTeam: () => void;
  onRefreshMembers: () => void;
  onUpdateAddress?: (address: string, lat: number, lng: number) => Promise<boolean>;
  onTeamMealLog?: (teamId: string, restaurantId: string, restaurantName: string, category: string) => void;
  onRenameTeam?: (name: string) => Promise<boolean>;
}

export default function TeamDashboard({
  team,
  members,
  userId,
  nickname,
  mapCenter,
  onLeaveTeam,
  onRefreshMembers,
  onUpdateAddress,
  onTeamMealLog,
  onRenameTeam,
}: TeamDashboardProps) {
  const [mode, setMode] = useState<TeamMode>('select');
  const dismissedVoteIdRef = useRef<string | null>(null);
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const { activeVote, isLoading: isVoteLoading, createVote, castVote, closeVote, clearVote, fetchActiveVote, subscribeToVotes, unsubscribe: unsubscribeVotes } = useTeamVote();
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

  // 진행 중(open) 투표가 있으면 자동으로 투표 화면 표시
  useEffect(() => {
    if (activeVote && activeVote.status === 'open' && mode === 'select' && dismissedVoteIdRef.current !== activeVote.id) {
      setMode('vote-active');
    }
    if (!activeVote && mode === 'vote-active') {
      setMode('select');
    }
    // 새 투표가 생기면 dismissed 초기화
    if (activeVote && dismissedVoteIdRef.current && dismissedVoteIdRef.current !== activeVote.id) {
      dismissedVoteIdRef.current = null;
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
    clearVote();
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
      <TeamHeader team={team} memberCount={members.length} onLeave={onLeaveTeam} onRename={onRenameTeam} />

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
      {mode === 'select' && (
        <div className="text-center">
          <h3 className="text-sm font-bold text-gray-800 mb-3">팀원들과 함께 점심을 정해보세요!</h3>
          <button
            onClick={handleStartCollecting}
            disabled={isSessionLoading}
            className="w-full py-4 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-2xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isSessionLoading ? '시작하는 중...' : '후보 모으기 시작'}
          </button>
          <p className="text-[11px] text-gray-400 mt-2">
            주변맛집/좋아요 탭에서 &apos;팀공유&apos; 버튼으로도 후보를 추가할 수 있어요
          </p>
        </div>
      )}

      {/* collecting 모드: 후보 리스트 + 다음 단계 */}
      {mode === 'collecting' && session && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <span>📋</span> 금일 후보 목록
              <span className="text-xs font-normal text-[#8B95FF]">({candidates.length}개)</span>
            </h3>
          </div>

          {candidates.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <div className="text-3xl mb-2">🍽️</div>
              <p className="text-sm">아직 후보가 없어요</p>
              <p className="text-xs mt-1 text-gray-300">
                주변맛집/좋아요 탭에서 &apos;팀공유&apos; 버튼을 눌러보세요
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {candidates.map((c) => {
                const memberName = members.find((m) => m.userId === c.addedBy)?.nickname || '알 수 없음';
                const sourceIcon = c.source === 'roulette' ? '🎰' : c.source === 'ai' ? '🤖' : '✋';
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg flex-shrink-0">{sourceIcon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.restaurant.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {c.restaurant.category} · {memberName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCandidate(c.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                      title="삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCancelSession}
              className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              초기화
            </button>
            <div className="flex-1 relative group">
              <button
                onClick={handleAdvance}
                disabled={candidates.length < 2}
                className="w-full py-3 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50"
              >
                다음 단계 →
              </button>
              {candidates.length < 2 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  두 개 이상 후보를 등록해주세요
                </div>
              )}
            </div>
          </div>
        </div>
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
            onTeamMealLog={onTeamMealLog ? (restaurant) => onTeamMealLog(team.id, restaurant.id, restaurant.name, restaurant.category) : undefined}
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
            onClick={() => {
              dismissedVoteIdRef.current = activeVote.id;
              setMode('select');
            }}
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
            onTeamMealLog={onTeamMealLog ? (restaurant) => onTeamMealLog(team.id, restaurant.id, restaurant.name, restaurant.category) : undefined}
          />
        </div>
      )}
    </div>
  );
}
