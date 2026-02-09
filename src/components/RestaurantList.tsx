'use client';

import { Restaurant } from '@/types';
import RestaurantCard from './RestaurantCard';

interface RestaurantListProps {
  restaurants: Restaurant[];
  isLoading?: boolean;
  onExcludeChange?: () => void;
  onFavoriteToggle?: (restaurant: Restaurant) => void;
  favoriteIds?: string[];
  excludedIds?: string[];
  onMealLog?: (restaurant: Restaurant) => void;
  onTeamCandidate?: (restaurant: Restaurant) => void;
  recentVisitIds?: string[];
}

export default function RestaurantList({ restaurants, isLoading, onExcludeChange, onFavoriteToggle, favoriteIds, excludedIds, onMealLog, onTeamCandidate, recentVisitIds }: RestaurantListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p>주소를 검색하면 주변 맛집을 찾아드려요!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {restaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          onExcludeChange={onExcludeChange}
          onFavoriteToggle={onFavoriteToggle}
          isFavorite={favoriteIds?.includes(restaurant.id) ?? false}
          isExcluded={excludedIds?.includes(restaurant.id) ?? false}
          onMealLog={onMealLog}
          onTeamCandidate={onTeamCandidate}
          isRecentVisit={recentVisitIds?.includes(restaurant.id)}
        />
      ))}
    </div>
  );
}
