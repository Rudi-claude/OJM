'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import RestaurantList from '@/components/RestaurantList';
import RandomRoulette from '@/components/RandomRoulette';
import KakaoMap from '@/components/KakaoMap';
import ChatContainer from '@/components/chat/ChatContainer';
import WeatherBadge from '@/components/WeatherBadge';
import { Restaurant, Category, WeatherData } from '@/types';

type ModeType = 'roulette' | 'chat';

export default function Home() {
  // 주소 검색 관련
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('전체');
  const [isLoading, setIsLoading] = useState(false);
  const [searchedAddress, setSearchedAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();

  // 날씨 관련
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // 모드 선택 관련
  const [selectedMode, setSelectedMode] = useState<ModeType | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // 주소 검색 완료 여부
  const isAddressSearched = searchedAddress && allRestaurants.length > 0 && mapCenter;

  // 날씨 조회
  const fetchWeather = async (lat: number, lng: number) => {
    setIsWeatherLoading(true);
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      if (data.weather) {
        setWeather(data.weather);
      }
    } catch (error) {
      console.error('날씨 조회 실패:', error);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const handleSearch = async (address: string) => {
    setIsLoading(true);
    setError(null);
    setSearchedAddress(address);
    setSelectedCategory('전체');
    setSelectedRestaurant(null);
    setSelectedMode(null);

    try {
      const response = await fetch(`/api/search?address=${encodeURIComponent(address)}&radius=500`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '검색 중 오류가 발생했어요.');
        setRestaurants([]);
        setAllRestaurants([]);
        setMapCenter(undefined);
        setWeather(null);
        return;
      }

      if (data.restaurants.length === 0) {
        setError('주변에 음식점을 찾지 못했어요. 다른 주소로 검색해보세요.');
        setRestaurants([]);
        setAllRestaurants([]);
        setMapCenter(undefined);
        setWeather(null);
      } else {
        setAllRestaurants(data.restaurants);
        setRestaurants(data.restaurants);
        setMapCenter(data.center);
        // 날씨도 함께 조회
        fetchWeather(data.center.lat, data.center.lng);
      }
    } catch (err) {
      console.error('검색 오류:', err);
      setError('검색 중 오류가 발생했어요. 다시 시도해주세요.');
      setRestaurants([]);
      setAllRestaurants([]);
      setMapCenter(undefined);
      setWeather(null);
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

  const handleBackToModeSelect = () => {
    setSelectedMode(null);
    setSelectedRestaurant(null);
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
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Step 1: 주소 검색 */}
        <section className="flex flex-col items-center gap-6 mb-8">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />

          {searchedAddress && !error && (
            <div className="flex items-center gap-3 px-4 py-2 bg-[#F5F6FF] rounded-full">
              <svg className="w-4 h-4 text-[#6B77E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="text-gray-600 text-sm">
                <span className="font-medium text-[#6B77E8]">{searchedAddress}</span> 주변
                {allRestaurants.length > 0 && (
                  <span className="ml-2 text-[#8B95FF]">({allRestaurants.length}곳)</span>
                )}
              </span>
              {weather && <WeatherBadge weather={weather} isLoading={isWeatherLoading} />}
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
        </section>

        {/* Step 2: 모드 선택 (주소 검색 완료 후) */}
        {isAddressSearched && !selectedMode && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-6">
              어떤 방식으로 점심을 고를까요?
            </h2>
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              <button
                onClick={() => setSelectedMode('roulette')}
                className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#6B77E8] hover:shadow-lg transition-all group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-[#6B77E8]/20 group-hover:scale-110 transition-transform">
                  🎰
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-800">룰렛 돌리기</p>
                  <p className="text-xs text-gray-400 mt-1">운에 맡기기!</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedMode('chat')}
                className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#6B77E8] hover:shadow-lg transition-all group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-[#6B77E8]/20 group-hover:scale-110 transition-transform">
                  🤖
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-800">AI 추천</p>
                  <p className="text-xs text-gray-400 mt-1">기분에 맞게!</p>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* 룰렛 모드 */}
        {isAddressSearched && selectedMode === 'roulette' && (
          <>
            {/* 뒤로가기 버튼 */}
            <button
              onClick={handleBackToModeSelect}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#6B77E8] mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              다른 방식으로 선택하기
            </button>

            {/* 카테고리 필터 */}
            <section className="mb-6">
              <CategoryFilter selected={selectedCategory} onChange={handleCategoryChange} />
            </section>

            {/* 랜덤 룰렛 */}
            <section className="mb-8">
              <RandomRoulette
                restaurants={restaurants}
                onSelect={handleRouletteSelect}
              />
            </section>

            {/* 지도 */}
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

            {/* 맛집 리스트 */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  {selectedCategory === '전체' ? '전체' : selectedCategory} 맛집
                  <span className="ml-2 text-sm font-normal text-[#8B95FF]">
                    {restaurants.length}곳
                  </span>
                </h2>
              </div>
              <RestaurantList restaurants={restaurants} isLoading={isLoading} />
            </section>
          </>
        )}

        {/* AI 추천 모드 */}
        {isAddressSearched && selectedMode === 'chat' && (
          <>
            {/* 뒤로가기 버튼 */}
            <button
              onClick={handleBackToModeSelect}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#6B77E8] mb-4 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              다른 방식으로 선택하기
            </button>

            <div className="h-[calc(100vh-280px)] bg-white rounded-2xl shadow-lg overflow-hidden">
              <ChatContainer
                restaurants={allRestaurants}
                weather={weather}
                mapCenter={mapCenter}
                searchedAddress={searchedAddress}
              />
            </div>
          </>
        )}

        {/* 주소 검색 전 안내 */}
        {!isAddressSearched && !isLoading && !error && (
          <section className="text-center py-16">
            <div className="text-6xl mb-6">🏢</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">회사 주소를 검색해주세요</h2>
            <p className="text-gray-400">
              주소 검색 후 주변 맛집을 추천받을 수 있어요
            </p>
          </section>
        )}
      </div>

      {/* 푸터 */}
      <footer className="bg-white py-8 mt-8 border-t border-gray-100">
        <p className="text-center text-gray-400 text-sm">
          맛집 추천 서비스 | 오점뭐?
        </p>
      </footer>
    </main>
  );
}
