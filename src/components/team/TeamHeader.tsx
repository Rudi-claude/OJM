'use client';

import { useState } from 'react';
import { Team } from '@/types';

interface TeamHeaderProps {
  team: Team;
  memberCount: number;
  onLeave: () => void;
}

export default function TeamHeader({ team, memberCount, onLeave }: TeamHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(team.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-800 truncate">{team.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={copyCode}
              className="flex items-center gap-1 px-2 py-0.5 bg-[#F5F6FF] rounded-lg text-xs font-mono text-[#6B77E8] hover:bg-[#E8EAFF] transition-colors"
            >
              <span className="tracking-widest">{team.code}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied && <span className="text-[10px] text-green-500">복사됨!</span>}
            </button>
            <span className="text-xs text-gray-400">{memberCount}명</span>
          </div>
        </div>

        {!showLeaveConfirm ? (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title="팀 나가기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={onLeave}
              className="px-2.5 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
            >
              나가기
            </button>
            <button
              onClick={() => setShowLeaveConfirm(false)}
              className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
