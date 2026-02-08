'use client';

import { useState } from 'react';
import { Team } from '@/types';

interface TeamJoinCreateProps {
  userId: string;
  isLoading: boolean;
  error: string | null;
  onCreateTeam: (name: string, userId: string) => Promise<Team | null>;
  onJoinTeam: (code: string, userId: string) => Promise<Team | null>;
}

export default function TeamJoinCreate({ userId, isLoading, error, onCreateTeam, onJoinTeam }: TeamJoinCreateProps) {
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');

  const handleCreate = async () => {
    const trimmed = teamName.trim();
    if (trimmed.length < 1 || trimmed.length > 50) return;
    await onCreateTeam(trimmed, userId);
  };

  const handleJoin = async () => {
    const trimmed = teamCode.trim().toUpperCase();
    if (trimmed.length !== 6) return;
    await onJoinTeam(trimmed, userId);
  };

  return (
    <div className="space-y-4">
      {/* 팀 만들기 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-3">팀 만들기</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="팀 이름 (예: 개발팀)"
            maxLength={50}
            className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B77E8] focus:ring-1 focus:ring-[#6B77E8]"
          />
          <button
            onClick={handleCreate}
            disabled={isLoading || teamName.trim().length < 1}
            className="px-4 py-2.5 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50 flex-shrink-0"
          >
            {isLoading ? '...' : '만들기'}
          </button>
        </div>
      </div>

      {/* 구분선 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">또는</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 팀 참여하기 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-3">팀 참여하기</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value.toUpperCase().slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="6자리 팀 코드"
            maxLength={6}
            className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B77E8] focus:ring-1 focus:ring-[#6B77E8] tracking-[0.3em] text-center font-mono uppercase"
          />
          <button
            onClick={handleJoin}
            disabled={isLoading || teamCode.trim().length !== 6}
            className="px-4 py-2.5 bg-white border-2 border-[#6B77E8] text-[#6B77E8] rounded-xl text-sm font-bold hover:bg-[#F5F6FF] transition-all disabled:opacity-50 flex-shrink-0"
          >
            {isLoading ? '...' : '참여하기'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 text-red-500 rounded-xl text-xs">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
