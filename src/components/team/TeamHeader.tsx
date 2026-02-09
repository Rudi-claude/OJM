'use client';

import { useState } from 'react';
import { Team } from '@/types';

interface TeamHeaderProps {
  team: Team;
  memberCount: number;
  onLeave: () => void;
  onRename?: (name: string) => Promise<boolean>;
}

export default function TeamHeader({ team, memberCount, onLeave, onRename }: TeamHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(team.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleRename = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === team.name || !onRename) {
      setIsEditing(false);
      setEditName(team.name);
      return;
    }
    setIsSubmitting(true);
    const success = await onRename(trimmed);
    if (success) {
      setIsEditing(false);
    } else {
      setEditName(team.name);
      setIsEditing(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isEditing ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') { setIsEditing(false); setEditName(team.name); }
                  }}
                  maxLength={20}
                  className="flex-1 min-w-0 px-2 py-1 bg-gray-50 border border-[#6B77E8] rounded-lg text-base font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#6B77E8]"
                  autoFocus
                  disabled={isSubmitting}
                />
                <button
                  onClick={handleRename}
                  disabled={isSubmitting || !editName.trim()}
                  className="px-2 py-1 bg-[#6B77E8] text-white rounded-lg text-xs font-medium hover:bg-[#5A66D6] transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {isSubmitting ? '...' : '확인'}
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditName(team.name); }}
                  className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex-shrink-0"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-base font-bold text-gray-800 truncate">{team.name}</h3>
                {onRename && (
                  <button
                    onClick={() => { setEditName(team.name); setIsEditing(true); }}
                    className="p-1 text-gray-300 hover:text-[#6B77E8] transition-colors flex-shrink-0"
                    title="팀 이름 수정"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
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
