'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (address: string) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      onSearch(address.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
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
  );
}
