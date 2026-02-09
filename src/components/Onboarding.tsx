'use client';

import { useState } from 'react';

const ONBOARDING_KEY = 'ojm_onboarding_seen';

const steps = [
  {
    icon: '🏢',
    title: '회사 주소를 검색하세요',
    desc: '주소를 입력하면 주변 맛집을 자동으로 찾아드려요',
  },
  {
    icon: '🎰',
    title: '룰렛 or AI 추천',
    desc: '룰렛로 운에 맡기거나, AI가 기분에 맞는 식당을 추천해줘요',
  },
  {
    icon: '👥',
    title: '팀과 함께 결정하세요',
    desc: '팀원들과 후보를 모아 룰렛이나 투표로 점심을 정할 수 있어요',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function shouldShowOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem(ONBOARDING_KEY);
}

export function markOnboardingSeen(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      markOnboardingSeen();
      onComplete();
    }
  };

  const handleSkip = () => {
    markOnboardingSeen();
    onComplete();
  };

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#F5F6FF] to-white flex flex-col items-center justify-center px-8">
      {/* Skip */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        건너뛰기
      </button>

      {/* Content */}
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="text-7xl mb-8 animate-bounce">{current.icon}</div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">{current.title}</h2>
        <p className="text-sm text-gray-500 leading-relaxed">{current.desc}</p>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mt-10 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === step ? 'bg-[#6B77E8] w-6' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Button */}
      <button
        onClick={handleNext}
        className="w-full max-w-sm py-3.5 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-2xl font-bold text-sm hover:shadow-lg transition-all"
      >
        {step < steps.length - 1 ? '다음' : '시작하기'}
      </button>
    </div>
  );
}
