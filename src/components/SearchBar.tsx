'use client';

import { useState, useEffect, useRef } from 'react';
import { getRecentAddresses, removeRecentAddress } from '@/lib/storage';

interface SearchBarProps {
  onSearch: (address: string) => void;
  onLocationSearch?: (lat: number, lng: number) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, onLocationSearch, isLoading }: SearchBarProps) {
  const [address, setAddress] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentAddresses(getRecentAddresses());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowRecent(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      setLocationError(null);
      setShowRecent(false);
      onSearch(address.trim());
    }
  };

  const handleRecentClick = (addr: string) => {
    setAddress(addr);
    setShowRecent(false);
    setLocationError(null);
    onSearch(addr);
  };

  const handleRemoveRecent = (e: React.MouseEvent, addr: string) => {
    e.stopPropagation();
    removeRecentAddress(addr);
    setRecentAddresses(getRecentAddresses());
  };

  const handleFocus = () => {
    const addresses = getRecentAddresses();
    setRecentAddresses(addresses);
    if (addresses.length > 0) {
      setShowRecent(true);
    }
  };

  // 모바일 기기 여부 판별
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  const handleLocationClick = () => {
    setLocationError(null);
    setLocationWarning(null);

    // PC에서는 위치가 부정확하므로 주소 입력 안내
    if (!isMobileDevice()) {
      setLocationWarning('PC에서는 위치가 부정확해요. 주소를 직접 입력해주세요!');
      return;
    }

    if (!navigator.geolocation) {
      setLocationError('이 브라우저에서는 위치 기능을 지원하지 않습니다.');
      return;
    }

    if (!onLocationSearch || isLocating) return;

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setIsLocating(false);

        // 정확도가 5km 이상이면 경고 표시
        if (accuracy > 5000) {
          setLocationWarning(`위치 정확도가 낮아요 (약 ${Math.round(accuracy / 1000)}km). 위치가 다르면 주소를 직접 입력해주세요.`);
        } else if (accuracy > 1000) {
          setLocationWarning('위치가 부정확할 수 있어요. 다르면 주소를 직접 입력해주세요.');
        }

        onLocationSearch(latitude, longitude);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('위치 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('위치 정보를 가져올 수 없습니다.');
            break;
          case error.TIMEOUT:
            setLocationError('위치 요청 시간이 초과되었습니다. 주소를 직접 입력해주세요.');
            break;
          default:
            setLocationError('위치를 가져오는 중 오류가 발생했습니다.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="w-full flex flex-col gap-2" ref={wrapperRef}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="flex-1 flex items-center gap-2 pl-3">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={handleFocus}
              placeholder="회사 주소를 입력하세요"
              className="flex-1 py-2.5 text-sm bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
              disabled={isLoading}
            />
          </div>
          <button
            type="button"
            onClick={handleLocationClick}
            disabled={isLoading || isLocating}
            className="p-2.5 text-[#6B77E8] hover:bg-[#F5F6FF] rounded-xl disabled:text-gray-300 disabled:cursor-not-allowed transition-all flex-shrink-0"
            title="현재 위치로 검색"
          >
            {isLocating ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
              </svg>
            )}
          </button>
          <button
            type="submit"
            disabled={isLoading || !address.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#6B77E8]/25 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                검색 중
              </span>
            ) : '검색'}
          </button>
        </div>
      </form>

      {/* 최근 검색 주소 드롭다운 */}
      {showRecent && recentAddresses.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-50">
            <span className="text-[11px] font-medium text-gray-400">최근 검색</span>
          </div>
          {recentAddresses.map((addr) => (
            <button
              key={addr}
              onClick={() => handleRecentClick(addr)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#F5F6FF] transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-700 truncate">{addr}</span>
              </div>
              <button
                onClick={(e) => handleRemoveRecent(e, addr)}
                className="p-1 text-gray-300 hover:text-red-400 flex-shrink-0 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </button>
          ))}
        </div>
      )}

      {locationWarning && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {locationWarning}
        </div>
      )}

      {locationError && (
        <p className="text-red-500 text-xs text-center">{locationError}</p>
      )}
    </div>
  );
}
