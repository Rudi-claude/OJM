'use client';

import { useState } from 'react';
import { Restaurant } from '@/types';

interface CandidateManualPickProps {
  restaurants: Restaurant[];
  existingCandidateIds: string[];
  onPick: (restaurant: Restaurant) => void;
}

export default function CandidateManualPick({ restaurants, existingCandidateIds, onPick }: CandidateManualPickProps) {
  const [filter, setFilter] = useState('');

  const filtered = restaurants.filter((r) => {
    if (!filter.trim()) return true;
    const q = filter.trim().toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="이름 또는 카테고리로 검색"
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B77E8] focus:ring-1 focus:ring-[#6B77E8]"
      />

      <div className="max-h-[250px] overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">검색 결과가 없어요</p>
        ) : (
          filtered.map((r) => {
            const isAdded = existingCandidateIds.includes(r.id);
            return (
              <div
                key={r.id}
                className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{r.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{r.category}</span>
                    <span className="text-[10px] text-gray-400">{r.distance}m</span>
                  </div>
                </div>
                {isAdded ? (
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <button
                    onClick={() => onPick(r)}
                    className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#F5F6FF] text-[#6B77E8] flex items-center justify-center hover:bg-[#E8EAFF] transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
