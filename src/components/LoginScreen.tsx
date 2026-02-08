'use client';

import { useState } from 'react';

interface LoginScreenProps {
  onKakaoLogin: () => Promise<void>;
  isLoading?: boolean;
}

export default function LoginScreen({ onKakaoLogin, isLoading }: LoginScreenProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsSigningIn(true);
    setLoginError(null);
    try {
      await onKakaoLogin();
      // signInWithOAuth 이후에도 여기에 오면 리다이렉트가 안 된 것
      setLoginError('리다이렉트 실패: 카카오 페이지로 이동하지 못했어요');
      setIsSigningIn(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoginError(`오류: ${msg}`);
      setIsSigningIn(false);
    }
  };

  const loading = isLoading || isSigningIn;

  return (
    <div className="mobile-container">
      <main className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          {/* 로고 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] bg-clip-text text-transparent">
              오점뭐?
            </h1>
            <p className="text-gray-400 text-sm mt-2">
              오늘 점심 뭐 먹지? 고민 끝!
            </p>
          </div>

          {/* 일러스트 */}
          <div className="text-6xl mb-8">🍽️</div>

          {/* 카카오 로그인 버튼 */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#FEE500', color: '#000000' }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9 0.6C4.02944 0.6 0 3.71288 0 7.55282C0 9.94578 1.5584 12.0452 3.93152 13.2968L2.93536 16.7869C2.8632 17.0374 3.15208 17.2374 3.3712 17.0905L7.4232 14.3793C7.9384 14.4437 8.4632 14.4771 9 14.4771C13.9706 14.4771 18 11.3642 18 7.52428C18 3.68432 13.9706 0.6 9 0.6Z"
                    fill="black"
                  />
                </svg>
                카카오로 시작하기
              </>
            )}
          </button>

          {loginError && (
            <p className="text-xs text-red-500 mt-3 bg-red-50 p-2 rounded-lg">
              {loginError}
            </p>
          )}
          <p className="text-xs text-gray-300 mt-4">
            간편하게 로그인하고 팀원들과 함께 점심을 정해보세요
          </p>
        </div>
      </main>
    </div>
  );
}
