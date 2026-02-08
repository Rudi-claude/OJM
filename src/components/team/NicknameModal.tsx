'use client';

import { useState } from 'react';

interface NicknameModalProps {
  onSubmit: (nickname: string) => Promise<boolean>;
}

export default function NicknameModal({ onSubmit }: NicknameModalProps) {
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 10) {
      setError('닉네임은 2~10자로 입력해주세요');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const success = await onSubmit(trimmed);
    if (!success) {
      setError('닉네임 저장에 실패했어요. 다시 시도해주세요.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-lg">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">👋</div>
          <h2 className="text-lg font-bold text-gray-800">닉네임을 정해주세요</h2>
          <p className="text-xs text-gray-400 mt-1">팀에서 사용할 이름이에요</p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="2~10자 닉네임"
            maxLength={10}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B77E8] focus:ring-1 focus:ring-[#6B77E8] text-center"
            autoFocus
          />

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || nickname.trim().length < 2}
            className="w-full py-3 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isSubmitting ? '저장 중...' : '시작하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
