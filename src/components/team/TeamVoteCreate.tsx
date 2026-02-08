'use client';

import { useState } from 'react';
import { Restaurant, TeamVote } from '@/types';

interface TeamVoteCreateProps {
  teamId: string;
  userId: string;
  restaurants: Restaurant[];
  preselectedIds?: string[];
  onCreateVote: (teamId: string, title: string, restaurants: Restaurant[], userId: string) => Promise<TeamVote | null>;
  onCancel: () => void;
}

export default function TeamVoteCreate({ teamId, userId, restaurants, preselectedIds, onCreateVote, onCancel }: TeamVoteCreateProps) {
  const [title, setTitle] = useState('오늘 점심 투표');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preselectedIds || []));
  const [isCreating, setIsCreating] = useState(false);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= 8) return;
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleCreate = async () => {
    if (selectedIds.size < 2) return;
    setIsCreating(true);
    const selected = restaurants.filter((r) => selectedIds.has(r.id));
    await onCreateVote(teamId, title.trim() || '오늘 점심 투표', selected, userId);
    setIsCreating(false);
  };

  return (
    <div className="space-y-4">
      {/* 제목 입력 */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">투표 제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="오늘 점심 투표"
          maxLength={100}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B77E8] focus:ring-1 focus:ring-[#6B77E8]"
        />
      </div>

      {/* 후보 선택 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">후보 식당 선택 (2~8개)</label>
          <span className="text-xs text-[#6B77E8] font-medium">{selectedIds.size}개 선택</span>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-1.5">
          {restaurants.map((r) => {
            const isSelected = selectedIds.has(r.id);
            return (
              <button
                key={r.id}
                onClick={() => toggleSelect(r.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-[#F5F6FF] border-2 border-[#6B77E8]'
                    : 'bg-white border border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-[#6B77E8] bg-[#6B77E8]' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{r.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{r.category}</span>
                    <span className="text-[10px] text-gray-400">{r.distance}m</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleCreate}
          disabled={isCreating || selectedIds.size < 2}
          className="flex-1 py-3 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isCreating ? '만드는 중...' : '투표 만들기'}
        </button>
      </div>
    </div>
  );
}
