'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import RestaurantList from '@/components/RestaurantList';
import RandomRoulette from '@/components/RandomRoulette';
import KakaoMap from '@/components/KakaoMap';
import ChatContainer from '@/components/chat/ChatContainer';
import { Restaurant, Category } from '@/types';

type TabType = 'search' | 'chat';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('전체');
  const [isLoading, setIsLoading] = useState(false);
  const [searchedAddress, setSearchedAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [showMap, setShowMap] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const handleSearch = async (address: string) => {
    setIsLoading(true);
    setError(null);
    setSearchedAddress(address);
    setSelectedCategory('전체');
    setSelectedRestaurant(null);

    try {
      const response = await fetch(`/api/search?address=${encodeURIComponent(address)}&radius=500`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '검색 중 오류가 발생했어요.');
        setRestaurants([]);
        setAllRestaurants([]);
        setMapCenter(undefined);
        return;
      }

      if (data.restaurants.length === 0) {
        setError('주변에 음식점을 찾지 못했어요. 다른 주소로 검색해보세요.');
        setRestaurants([]);
        setAllRestaurants([]);
        setMapCenter(undefined);
      } else {
        setAllRestaurants(data.restaurants);
        setRestaurants(data.restaurants);
        setMapCenter(data.center);
      }
    } catch (err) {
      console.error('검색 오류:', err);
      setError('검색 중 오류가 발생했어요. 다시 시도해주세요.');
      setRestaurants([]);
      setAllRestaurants([]);
      setMapCenter(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setSelectedRestaurant(null);

    if (category === '전체') {
      setRestaurants(allRestaurants);
    } else {
      const filtered = allRestaurants.filter((r) => r.category === category);
      setRestaurants(filtered);
    }
  };

  const handleRouletteSelect = (restaurant: Restaurant | null) => {
    setSelectedRestaurant(restaurant);
  };

  return (
    <main className="min-h-screen bg-[#F8F9FC]">
      {/* 헤더 */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] bg-clip-text text-transparent">
            오점뭐?
          </h1>
          <p className="text-center text-gray-400 text-sm mt-1">
            오늘 점심 뭐 먹지? 고민 끝!
          </p>
        </div>

        {/* 탭 */}
        <div className="max-w-5xl mx-auto flex">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'search'
                ? 'text-[#6B77E8]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              주소 검색
            </span>
            {activeTab === 'search' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'chat'
                ? 'text-[#6B77E8]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              AI 추천
            </span>
            {activeTab === 'chat' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* 탭 콘텐츠 */}
      {activeTab === 'search' ? (
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* 검색 영역 */}
          <section className="flex flex-col items-center gap-6 mb-8">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />

            {searchedAddress && !error && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#F5F6FF] rounded-full">
                <svg className="w-4 h-4 text-[#6B77E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-gray-600 text-sm">
                  <span className="font-medium text-[#6B77E8]">{searchedAddress}</span> 주변
                  {allRestaurants.length > 0 && (
                    <span className="ml-2 text-[#8B95FF]">({allRestaurants.length}곳)</span>
                  )}
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {allRestaurants.length > 0 && (
              <CategoryFilter selected={selectedCategory} onChange={handleCategoryChange} />
            )}
          </section>

          {/* 랜덤 룰렛 */}
          {restaurants.length > 0 && (
            <section className="mb-8">
              <RandomRoulette
                restaurants={restaurants}
                onSelect={handleRouletteSelect}
              />
            </section>
          )}

          {/* 지도 */}
          {restaurants.length > 0 && (
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">지도로 보기</h2>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="text-sm text-[#6B77E8] hover:text-[#5A66D6] font-medium"
                >
                  {showMap ? '숨기기' : '보기'}
                </button>
              </div>
              {showMap && (
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <KakaoMap
                    restaurants={restaurants}
                    center={mapCenter}
                    selectedRestaurant={selectedRestaurant}
                  />
                </div>
              )}
            </section>
          )}

          {/* 맛집 리스트 */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {restaurants.length > 0
                  ? `${selectedCategory === '전체' ? '전체' : selectedCategory} 맛집`
                  : '맛집 찾기'}
                {restaurants.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-[#8B95FF]">
                    {restaurants.length}곳
                  </span>
                )}
              </h2>
            </div>
            <RestaurantList restaurants={restaurants} isLoading={isLoading} />
          </section>
        </div>
      ) : (
        <div className="h-[calc(100vh-130px)]">
          <ChatContainer />
        </div>
      )}

      {/* 푸터 */}
      {activeTab === 'search' && (
        <footer className="bg-white py-8 mt-8 border-t border-gray-100">
          <p className="text-center text-gray-400 text-sm">
            맛집 추천 서비스 | 오점뭐?
          </p>
        </footer>
      )}
    </main>
  );
}
