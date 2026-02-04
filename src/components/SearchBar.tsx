'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (address: string) => void;
  onLocationSearch?: (lat: number, lng: number) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, onLocationSearch, isLoading }: SearchBarProps) {
  const [address, setAddress] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      setLocationError(null);
      onSearch(address.trim());
    }
  };

  const handleLocationClick = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('이 브라우저에서는 위치 기능을 지원하지 않습니다.');
      return;
    }

    if (!onLocationSearch) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationSearch(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('위치 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('위치 정보를 가져올 수 없습니다.');
            break;
          case error.TIMEOUT:
            setLocationError('위치 요청 시간이 초과되었습니다.');
            break;
          default:
            setLocationError('위치를 가져오는 중 오류가 발생했습니다.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div className="w-full max-w-xl flex flex-col gap-2">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 p-2 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="flex-1 flex items-center gap-3 px-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="회사 주소를 입력하세요"
              className="flex-1 py-3 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none"
              disabled={isLoading}
            />
          </div>
          <button
            type="button"
            onClick={handleLocationClick}
            disabled={isLoading}
            className="px-3 py-3 text-[#6B77E8] hover:bg-[#F5F6FF] rounded-xl disabled:text-gray-300 disabled:cursor-not-allowed transition-all"
            title="현재 위치로 검색"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
            </svg>
          </button>
          <button
            type="submit"
            disabled={isLoading || !address.trim()}
            className="px-6 py-3 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#6B77E8]/25 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
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
      {locationError && (
        <p className="text-red-500 text-xs text-center">{locationError}</p>
      )}
    </div>
  );
}
