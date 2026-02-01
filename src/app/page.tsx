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

  // 주소 검색 핸들러
  const handleSearch = async (address: string) => {
    setIsLoading(true);
    setError(null);
    setSearchedAddress(address);
    setSelectedCategory('전체');
    setSelectedRestaurant(null);

    try {
      // 서버 API 호출
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

  // 카테고리 변경 핸들러
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

  // 룰렛 선택 핸들러
  const handleRouletteSelect = (restaurant: Restaurant | null) => {
    setSelectedRestaurant(restaurant);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-orange-500 text-center">
            오점뭐? (O.J.M)
          </h1>
          <p className="text-center text-gray-500 text-sm mt-1">
            오늘 점심 뭐 먹지? 고민 끝!
          </p>
        </div>

        {/* 탭 */}
        <div className="max-w-5xl mx-auto flex border-t">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔍 주소 검색
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💬 대화 추천
          </button>
        </div>
      </header>

      {/* 탭 콘텐츠 */}
      {activeTab === 'search' ? (
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* 검색 영역 */}
          <section className="flex flex-col items-center gap-6 mb-12">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />

            {searchedAddress && !error && (
              <p className="text-gray-600">
                <span className="font-medium">{searchedAddress}</span> 주변 맛집
                {allRestaurants.length > 0 && (
                  <span className="text-orange-500 ml-2">({allRestaurants.length}곳 발견)</span>
                )}
              </p>
            )}

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {allRestaurants.length > 0 && (
              <CategoryFilter selected={selectedCategory} onChange={handleCategoryChange} />
            )}
          </section>

          {/* 랜덤 룰렛 */}
          {restaurants.length > 0 && (
            <section className="mb-12">
              <RandomRoulette
                restaurants={restaurants}
                onSelect={handleRouletteSelect}
              />
            </section>
          )}

          {/* 지도 */}
          {restaurants.length > 0 && (
            <section className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">지도로 보기</h2>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="text-sm text-orange-500 hover:text-orange-600"
                >
                  {showMap ? '지도 숨기기' : '지도 보기'}
                </button>
              </div>
              {showMap && (
                <KakaoMap
                  restaurants={restaurants}
                  center={mapCenter}
                  selectedRestaurant={selectedRestaurant}
                />
              )}
            </section>
          )}

          {/* 맛집 리스트 */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {restaurants.length > 0
                  ? `${selectedCategory === '전체' ? '전체' : selectedCategory} 맛집 ${restaurants.length}곳`
                  : '맛집 찾기'}
              </h2>
            </div>
            <RestaurantList restaurants={restaurants} isLoading={isLoading} />
          </section>
        </div>
      ) : (
        <div className="h-[calc(100vh-140px)]">
          <ChatContainer />
        </div>
      )}

      {/* 푸터 - 검색 탭일 때만 표시 */}
      {activeTab === 'search' && (
        <footer className="bg-gray-50 py-6 mt-12">
          <p className="text-center text-gray-400 text-sm">
            성수 직장인을 위한 점심 추천 서비스 | O.J.M
          </p>
        </footer>
      )}
    </main>
  );
}
