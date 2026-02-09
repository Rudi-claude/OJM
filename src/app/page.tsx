'use client';

import { useState, useEffect, useRef } from 'react';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import RestaurantList from '@/components/RestaurantList';
import RandomRoulette from '@/components/RandomRoulette';
import KakaoMap from '@/components/KakaoMap';
import ChatContainer from '@/components/chat/ChatContainer';
import WeatherBadge from '@/components/WeatherBadge';
import LoginScreen from '@/components/LoginScreen';
import MealHistory from '@/components/MealHistory';
import NicknameModal from '@/components/team/NicknameModal';
import TeamJoinCreate from '@/components/team/TeamJoinCreate';
import TeamDashboard from '@/components/team/TeamDashboard';
import { Restaurant, Category, WeatherData, MealLog, CandidateSource } from '@/types';
import { addRecentAddress, getExcludes, clearExcludes } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import { useMealLogs } from '@/hooks/useMealLogs';
import { useFavorites } from '@/hooks/useFavorites';
import { useTeam } from '@/hooks/useTeam';
import { useTeamSession } from '@/hooks/useTeamSession';

type ModeType = 'roulette' | 'chat';
type TabType = 'nearby' | 'favorites' | 'history' | 'team';

function NicknameEditForm({ currentNickname, onSubmit, onCancel }: {
  currentNickname: string;
  onSubmit: (nickname: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [nickname, setNickname] = useState(currentNickname);
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
      setError('닉네임 저장에 실패했어요');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="text-center mb-5">
        <h2 className="text-base font-bold text-gray-800">닉네임 변경</h2>
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
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || nickname.trim().length < 2}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {isSubmitting ? '저장 중...' : '변경'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  // 주소 검색 관련
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(['전체']);
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

  // 반경 확장 안내
  const [expandedRadius, setExpandedRadius] = useState<number | null>(null);

  // 제외 관련
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  // 탭
  const [activeTab, setActiveTab] = useState<TabType>('nearby');

  // 내정보 드롭다운 & 닉네임 수정 모달
  const [showMyInfo, setShowMyInfo] = useState(false);
  const [showNicknameEdit, setShowNicknameEdit] = useState(false);


  // 토스트
  const [toast, setToast] = useState<string | null>(null);

  // 사용자 & 식사 기록
  const { user, isLoading: isUserLoading, isAuthenticated, kakaoName, signInWithKakao, signOut, updateNickname } = useAuth();
  const { favorites: favoriteRestaurants, favoriteIds, toggleFavorite, addFavorite, isFavorite } = useFavorites(user?.id);
  const { mealLogs, fetchMealLogs, addMealLog, deleteMealLog } = useMealLogs();

  // 팀
  const {
    team,
    members,
    isLoading: isTeamLoading,
    error: teamError,
    createTeam,
    joinTeam,
    leaveTeam,
    fetchMembers,
    refreshTeam,
    updateTeamAddress,
    updateTeamName,
  } = useTeam();

  // 팀 세션
  const {
    session: teamSession,
    addCandidate,
    ensureSessionAndAddCandidate,
    fetchActiveSession,
    subscribeToSession,
    unsubscribe: unsubscribeSession,
  } = useTeamSession();

  // 팀이 있으면 세션 구독 시작
  useEffect(() => {
    if (team?.id) {
      fetchActiveSession(team.id);
      subscribeToSession(team.id);
    }
    return () => {
      unsubscribeSession();
    };
  }, [team?.id, fetchActiveSession, subscribeToSession, unsubscribeSession]);

  // 사용자 로드 시 식사 기록 조회
  useEffect(() => {
    if (user?.id) {
      fetchMealLogs(user.id, 7);
    }
  }, [user?.id, fetchMealLogs]);

  // 팀 정보 복원
  useEffect(() => {
    if (user?.id) {
      refreshTeam(user.id);
    }
  }, [user?.id, refreshTeam]);

  // 팀 회사주소 자동 검색 (로그인 후 팀에 가입된 상태에서 주소가 있으면)
  const autoSearchedRef = useRef(false);
  useEffect(() => {
    if (autoSearchedRef.current) return;
    if (team?.address && allRestaurants.length === 0 && !isLoading) {
      autoSearchedRef.current = true;
      handleSearch(team.address);
    }
  }, [team?.address, allRestaurants.length, isLoading]);

  // 제외 목록 로드
  useEffect(() => {
    setExcludedIds(getExcludes());
  }, []);


  // 최근 3일 내 방문 식당 ID 목록
  const recentVisitIds = mealLogs
    .filter((log) => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return log.ateAt >= threeDaysAgo;
    })
    .map((log) => log.restaurantId);

  // 이번 주 먹은 식당 ID (룰렛/AI에서 제외)
  const thisWeekEatenIds = (() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return [...new Set(
      mealLogs
        .filter((log) => new Date(log.ateAt) >= monday)
        .map((log) => log.restaurantId)
    )];
  })();

  // 토스트 표시
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  // 제외 필터 적용된 식당 목록 (수동 제외 + 이번 주 먹은 식당)
  const getFilteredRestaurants = (list: Restaurant[]) => {
    return list.filter((r) => !excludedIds.includes(r.id) && !thisWeekEatenIds.includes(r.id));
  };

  // 제외 목록 변경 핸들러
  const handleExcludeChange = () => {
    const newExcludes = getExcludes();
    setExcludedIds(newExcludes);
  };

  // 제외 목록 초기화
  const handleClearExcludes = () => {
    clearExcludes();
    setExcludedIds([]);
    showToast('제외 목록을 초기화했어요');
  };

  // 식사 기록 저장
  const handleMealLog = async (restaurant: Restaurant): Promise<boolean> => {
    if (!user?.id) {
      showToast('사용자 정보를 불러오는 중이에요');
      return false;
    }
    const success = await addMealLog({
      userId: user.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      category: restaurant.category,
      weather: weather?.condition,
    });
    if (success) {
      showToast(`${restaurant.name}에서 식사 기록 완료!`);
    } else {
      showToast('기록 저장에 실패했어요');
    }
    return success;
  };

  // 좋아요 변경 핸들러 (RestaurantCard에서 토글 후 호출)
  const handleFavoriteToggle = async (restaurant: Restaurant) => {
    await toggleFavorite(restaurant);
  };

  // 팀 후보 추가 핸들러 (세션 없으면 자동 생성)
  const handleAddTeamCandidate = async (restaurant: Restaurant, source: CandidateSource = 'manual') => {
    if (!user?.id || !team) return;
    const { success, isNew } = await ensureSessionAndAddCandidate(team.id, restaurant, user.id, source);
    if (success) {
      const msg = isNew
        ? `새 세션을 시작하고 ${restaurant.name}을(를) 팀 후보에 추가했어요`
        : `${restaurant.name}을(를) 팀 후보에 추가했어요`;
      showToast(msg);
    } else {
      showToast('이미 팀 후보에 있어요');
    }
  };

  // 팀 식사 기록 핸들러
  const handleTeamMealLog = async (teamId: string, restaurantId: string, restaurantName: string, category: string) => {
    try {
      const response = await fetch('/api/team-meal-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, restaurantId, restaurantName, category }),
      });
      const data = await response.json();
      if (data.success) {
        showToast(`팀 전체 식사 기록 완료! (${data.count}명)`);
        if (user?.id) {
          fetchMealLogs(user.id, 7);
        }
      } else {
        showToast('식사 기록 저장에 실패했어요');
      }
    } catch {
      showToast('식사 기록 저장에 실패했어요');
    }
  };

  // 팀에 가입되어 있으면 팀공유 가능
  const canAddTeamCandidate = !!team;


  // 주소 검색 완료 여부
  const isAddressSearched = searchedAddress && allRestaurants.length > 0 && mapCenter;

  // 제외 적용된 식당 (룰렛/AI용)
  const filteredAllRestaurants = getFilteredRestaurants(allRestaurants);
  const filteredRestaurants = getFilteredRestaurants(restaurants);
  const excludedCount = excludedIds.filter((id) => allRestaurants.some((r) => r.id === id)).length;

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

  const handleSearchResult = (data: any, fallbackAddress: string) => {
    if (data.restaurants.length === 0) {
      setError('주변에 음식점을 찾지 못했어요. 다른 주소로 검색해보세요.');
      setRestaurants([]);
      setAllRestaurants([]);
      setMapCenter(undefined);
      setWeather(null);
      setExpandedRadius(null);
    } else {
      const quality = data.restaurants.filter(
        (r: Restaurant) => !r.rating || r.rating > 3.5
      );
      setAllRestaurants(quality);
      setRestaurants(quality);
      setMapCenter(data.center);
      setSearchedAddress(data.address || fallbackAddress);
      setExpandedRadius(data.expandedRadius || null);
      fetchWeather(data.center.lat, data.center.lng);
    }
  };

  const handleSearch = async (address: string) => {
    setIsLoading(true);
    setError(null);
    setSearchedAddress(address);
    setSelectedCategories(['전체']);
    setSelectedRestaurant(null);
    setSelectedMode(null);

    try {
      const response = await fetch(`/api/search?address=${encodeURIComponent(address)}&radius=2000`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '검색 중 오류가 발생했어요.');
        setRestaurants([]);
        setAllRestaurants([]);
        setMapCenter(undefined);
        setWeather(null);
        return;
      }

      handleSearchResult(data, address);

      // 검색 성공 시 최근 주소 저장
      if (data.restaurants.length > 0) {
        addRecentAddress(address);
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

  const handleLocationSearch = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    setSearchedAddress('현재 위치');
    setSelectedCategories(['전체']);
    setSelectedRestaurant(null);
    setSelectedMode(null);

    try {
      const response = await fetch(`/api/search?lat=${lat}&lng=${lng}&radius=2000`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '검색 중 오류가 발생했어요.');
        setRestaurants([]);
        setAllRestaurants([]);
        setMapCenter(undefined);
        setWeather(null);
        return;
      }

      handleSearchResult(data, '현재 위치');
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

  const handleCategoryChange = (categories: Category[]) => {
    setSelectedCategories(categories);
    setSelectedRestaurant(null);

    if (categories.includes('전체')) {
      setRestaurants(allRestaurants);
    } else {
      const filtered = allRestaurants.filter((r) => categories.includes(r.category as Category));
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

  const handleReset = () => {
    setRestaurants([]);
    setAllRestaurants([]);
    setSelectedCategories(['전체']);
    setIsLoading(false);
    setSearchedAddress('');
    setError(null);
    setMapCenter(undefined);
    setWeather(null);
    setExpandedRadius(null);
    setSelectedMode(null);
    setSelectedRestaurant(null);
    setActiveTab('nearby');
  };

  // 팀 나가기 핸들러
  const handleLeaveTeam = async () => {
    if (!user?.id) return;
    const success = await leaveTeam(user.id);
    if (success) {
      showToast('팀에서 나왔어요');
    } else {
      showToast('팀 나가기에 실패했어요');
    }
  };

  // 로그인 전: LoginScreen 표시
  if (!isAuthenticated && !isUserLoading) {
    return <LoginScreen />;
  }

  // 로딩 중
  if (isUserLoading) {
    return (
      <div className="mobile-container">
        <main className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#6B77E8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">로딩 중...</p>
          </div>
        </main>
      </div>
    );
  }

  // 닉네임 미설정: NicknameModal 표시
  if (!user?.nickname) {
    return (
      <div className="mobile-container">
        <main className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center">
          <NicknameModal onSubmit={updateNickname} defaultNickname={kakaoName || undefined} />
        </main>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <main className="min-h-screen bg-[#F8F9FC] flex flex-col">
        {/* 헤더 */}
        <header className="bg-white sticky top-0 z-10 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex-1" />
            <div className="text-center cursor-pointer" onClick={handleReset}>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] bg-clip-text text-transparent">
                오점뭐?
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">
                오늘 점심 뭐 먹지? 고민 끝!
              </p>
            </div>
            <div className="flex-1 flex justify-end relative">
              <button
                onClick={() => setShowMyInfo((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-[#6B77E8] transition-colors px-2 py-1"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] flex items-center justify-center text-white text-[10px] font-bold">
                  {user?.nickname?.charAt(0) || '?'}
                </div>
                <span className="text-xs font-medium">내정보</span>
              </button>
              {showMyInfo && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowMyInfo(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-30 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-xs text-gray-400">닉네임</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{user?.nickname || '미설정'}</p>
                    </div>
                    <button
                      onClick={() => { setShowMyInfo(false); setShowNicknameEdit(true); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      닉네임 수정
                    </button>
                    <button
                      onClick={() => { setShowMyInfo(false); signOut(); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* 탭 네비게이션 */}
          <div className="flex border-t border-gray-100">
            <button
              onClick={() => setActiveTab('nearby')}
              className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                activeTab === 'nearby'
                  ? 'text-[#6B77E8] border-b-2 border-[#6B77E8]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              주변 맛집
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                activeTab === 'favorites'
                  ? 'text-[#6B77E8] border-b-2 border-[#6B77E8]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              좋아요 {favoriteRestaurants.length > 0 && <span className="ml-1 text-xs bg-[#6B77E8] text-white px-1.5 py-0.5 rounded-full">{favoriteRestaurants.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                activeTab === 'history'
                  ? 'text-[#6B77E8] border-b-2 border-[#6B77E8]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              식사내역
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                activeTab === 'team'
                  ? 'text-[#6B77E8] border-b-2 border-[#6B77E8]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              우리 팀
            </button>
          </div>
        </header>

        <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* 팀 탭 */}
        {activeTab === 'team' && (
          <section>
            {!team ? (
              /* 팀 미가입 */
              <TeamJoinCreate
                userId={user.id}
                isLoading={isTeamLoading}
                error={teamError}
                onCreateTeam={createTeam}
                onJoinTeam={joinTeam}
              />
            ) : (
              /* 팀 가입 상태 */
              <TeamDashboard
                team={team}
                members={members}
                userId={user.id}
                nickname={user.nickname}
                mapCenter={mapCenter}
                onLeaveTeam={handleLeaveTeam}
                onRefreshMembers={() => fetchMembers()}
                onUpdateAddress={(address, lat, lng) => updateTeamAddress(team.id, address, lat, lng)}
                onTeamMealLog={handleTeamMealLog}
                onRenameTeam={async (name) => {
                  const success = await updateTeamName(team.id, name);
                  if (success) showToast('팀 이름이 변경되었어요');
                  else showToast('팀 이름 변경에 실패했어요');
                  return success;
                }}
              />
            )}
          </section>
        )}

        {/* 좋아요 탭 */}
        {activeTab === 'favorites' && (
          <section>
            {/* 좋아요한 식당 목록 */}
            {favoriteRestaurants.length > 0 ? (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">내가 좋아요한 식당 ({favoriteRestaurants.length}곳)</p>
                <RestaurantList
                  restaurants={favoriteRestaurants}
                  onFavoriteToggle={handleFavoriteToggle}
                  favoriteIds={favoriteIds}
                  onExcludeChange={handleExcludeChange}
                  onTeamCandidate={canAddTeamCandidate ? (r) => handleAddTeamCandidate(r, 'manual') : undefined}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">👍</div>
                <p className="text-sm">아직 좋아요한 식당이 없어요</p>
                <p className="text-xs mt-1 text-gray-300">주변 맛집 탭에서 좋아요를 눌러보세요!</p>
              </div>
            )}
          </section>
        )}

        {/* 식사내역 탭 */}
        {activeTab === 'history' && (
          <MealHistory mealLogs={mealLogs} onDelete={deleteMealLog} />
        )}

        {/* 주변 맛집 탭 */}
        {activeTab === 'nearby' && <>
        {/* Step 1: 주소 검색 */}
        <section className="flex flex-col items-center gap-3 mb-6">
          <SearchBar onSearch={handleSearch} onLocationSearch={handleLocationSearch} isLoading={isLoading} defaultAddress={team?.address || undefined} />

          {searchedAddress && !error && (
            <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-2 bg-[#F5F6FF] rounded-xl w-full">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#6B77E8] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-xs text-gray-600">
                  <span className="font-medium text-[#6B77E8]">{searchedAddress}</span> 주변
                  {allRestaurants.length > 0 && (
                    <span className="ml-1 text-[#8B95FF]">({allRestaurants.length}곳)</span>
                  )}
                </span>
              </div>
              {weather && <WeatherBadge weather={weather} isLoading={isWeatherLoading} />}
            </div>
          )}

          {/* 제외된 식당 수 표시 */}
          {excludedCount > 0 && isAddressSearched && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-xs w-full">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span className="text-gray-500">{excludedCount}곳 제외됨</span>
              <button
                onClick={handleClearExcludes}
                className="ml-auto text-[#6B77E8] hover:text-[#5A66D6] font-medium"
              >
                초기화
              </button>
            </div>
          )}

          {expandedRadius && !error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs w-full">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              주변 1km 내 결과가 없어 반경 {expandedRadius >= 1000 ? `${(expandedRadius / 1000).toFixed(1)}km` : `${expandedRadius}m`}로 확장했어요
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 text-red-500 rounded-xl text-xs w-full">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </section>

        {/* Step 2: 모드 선택 (주소 검색 완료 후) */}
        {isAddressSearched && !selectedMode && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-gray-800 text-center mb-4">
              어떤 방식으로 점심을 고를까요?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedMode('roulette')}
                className="flex flex-col items-center gap-2.5 p-5 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#6B77E8] hover:shadow-lg transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-[#6B77E8]/20 group-hover:scale-110 transition-transform">
                  🎰
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm text-gray-800">룰렛 돌리기</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">운에 맡기기!</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedMode('chat')}
                className="flex flex-col items-center gap-2.5 p-5 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#6B77E8] hover:shadow-lg transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-[#6B77E8]/20 group-hover:scale-110 transition-transform">
                  🤖
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm text-gray-800">AI 추천</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">기분에 맞게!</p>
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
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#6B77E8] mb-4 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              다른 방식으로 선택하기
            </button>

            {/* 카테고리 필터 */}
            <section className="mb-4">
              <CategoryFilter selected={selectedCategories} onChange={handleCategoryChange} />
            </section>

            {/* 랜덤 룰렛 */}
            <section className="mb-6">
              <RandomRoulette
                restaurants={filteredRestaurants}
                onSelect={handleRouletteSelect}
                mapCenter={mapCenter}
                onMealLog={handleMealLog}
                onTeamCandidate={canAddTeamCandidate ? (r) => handleAddTeamCandidate(r, 'roulette') : undefined}
                onFavoriteToggle={handleFavoriteToggle}
                isFavorite={isFavorite}
              />
            </section>

            {/* 지도 */}
            <section className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-bold text-gray-800">지도로 보기</h2>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="text-xs text-[#6B77E8] hover:text-[#5A66D6] font-medium"
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
            <section className="pb-2">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-bold text-gray-800">
                  {selectedCategories.includes('전체') ? '전체' : selectedCategories.join('·')} 맛집
                  <span className="ml-1.5 text-xs font-normal text-[#8B95FF]">
                    {restaurants.length}곳
                  </span>
                </h2>
              </div>
              <RestaurantList
                restaurants={restaurants}
                isLoading={isLoading}
                onExcludeChange={handleExcludeChange}
                onFavoriteToggle={handleFavoriteToggle}
                favoriteIds={favoriteIds}
                excludedIds={excludedIds}
                onMealLog={handleMealLog}
                onTeamCandidate={canAddTeamCandidate ? (r) => handleAddTeamCandidate(r, 'manual') : undefined}
                recentVisitIds={recentVisitIds}
              />
            </section>
          </>
        )}

        {/* AI 추천 모드 */}
        {isAddressSearched && selectedMode === 'chat' && (
          <>
            {/* 뒤로가기 버튼 */}
            <button
              onClick={handleBackToModeSelect}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#6B77E8] mb-3 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              다른 방식으로 선택하기
            </button>

            <div className="h-[calc(100vh-240px)] bg-white rounded-2xl shadow-lg overflow-hidden">
              <ChatContainer
                restaurants={filteredAllRestaurants}
                weather={weather}
                mapCenter={mapCenter}
                searchedAddress={searchedAddress}
                userId={user?.id}
                onTeamCandidate={canAddTeamCandidate ? (r) => handleAddTeamCandidate(r, 'ai') : undefined}
                onMealLog={handleMealLog}
              />
            </div>
          </>
        )}

        {/* 주소 검색 전 안내 */}
        {!isAddressSearched && !isLoading && !error && (
          <section className="text-center py-12">
            <div className="text-5xl mb-4">🏢</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1.5">회사 주소를 검색해주세요</h2>
            <p className="text-sm text-gray-400">
              주소 검색 후 주변 맛집을 추천받을 수 있어요
            </p>
          </section>
        )}
        </>}
        </div>

        {/* 닉네임 수정 모달 */}
        {showNicknameEdit && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6" onClick={() => setShowNicknameEdit(false)}>
            <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <NicknameEditForm
                currentNickname={user?.nickname || ''}
                onSubmit={async (nickname) => {
                  const success = await updateNickname(nickname);
                  if (success) {
                    setShowNicknameEdit(false);
                    showToast('닉네임이 변경되었어요');
                  }
                  return success;
                }}
                onCancel={() => setShowNicknameEdit(false)}
              />
            </div>
          </div>
        )}

        {/* 토스트 알림 */}
        {toast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-gray-800 text-white text-sm rounded-xl shadow-lg animate-fade-in">
            {toast}
          </div>
        )}

        {/* 푸터 */}
        <footer className="bg-white py-4 border-t border-gray-100">
          <p className="text-center text-gray-400 text-xs">
            맛집 추천 서비스 | 오점뭐?
          </p>
        </footer>
      </main>
    </div>
  );
}
