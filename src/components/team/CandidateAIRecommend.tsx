'use client';

import { useState } from 'react';
import { Restaurant, ScoredRestaurant, MoodType } from '@/types';
import MoodChips from '@/components/chat/MoodChips';

interface CandidateAIRecommendProps {
  restaurants: Restaurant[];
  mapCenter?: { lat: number; lng: number };
  existingCandidateIds: string[];
  onPick: (restaurant: Restaurant) => void;
}

export default function CandidateAIRecommend({
  restaurants,
  mapCenter,
  existingCandidateIds,
  onPick,
}: CandidateAIRecommendProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScoredRestaurant[]>([]);
  const [message, setMessage] = useState('');

  const handleMoodSelect = async (mood: MoodType) => {
    setSelectedMood(mood);
    setIsLoading(true);
    setResults([]);
    setMessage('');

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          restaurants,
          lat: mapCenter?.lat,
          lng: mapCenter?.lng,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data.restaurants || []);
        setMessage(data.message || '');
      }
    } catch (err) {
      console.error('AI 추천 실패:', err);
      setMessage('추천을 가져오는데 실패했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 font-medium">오늘 기분은?</p>
      <MoodChips
        onSelect={handleMoodSelect}
        disabled={isLoading}
        selectedMood={selectedMood || undefined}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-[#6B77E8] border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-xs text-gray-400">AI가 추천 중...</span>
        </div>
      )}

      {message && !isLoading && (
        <p className="text-xs text-gray-500 bg-[#F5F6FF] rounded-xl px-3 py-2">{message}</p>
      )}

      {results.length > 0 && !isLoading && (
        <div className="space-y-1.5">
          {results.map((r) => {
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
                  {r.reasons && r.reasons.length > 0 && (
                    <p className="text-[10px] text-[#6B77E8] mt-1 truncate">{r.reasons[0]}</p>
                  )}
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
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#F5F6FF] text-[#6B77E8] text-xs font-medium hover:bg-[#E8EAFF] transition-colors"
                  >
                    추가
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
