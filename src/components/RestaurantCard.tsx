'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/types';
import { getFavoriteIds, toggleFavorite, toggleExclude } from '@/lib/storage';

interface BlogReview {
  title: string;
  description: string;
  bloggerName: string;
  date: string;
  link: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  onExcludeChange?: () => void;
  onFavoriteChange?: () => void;
  onMealLog?: (restaurant: Restaurant) => void;
  isRecentVisit?: boolean;
}

export default function RestaurantCard({ restaurant, onExcludeChange, onFavoriteChange, onMealLog, isRecentVisit }: RestaurantCardProps) {
  const { name, category, address, distance, rating, phone, placeUrl } = restaurant;
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<BlogReview[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    setIsFavorite(getFavoriteIds().includes(restaurant.id));
  }, [restaurant.id]);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowFavorite = toggleFavorite(restaurant);
    setIsFavorite(nowFavorite);
    onFavoriteChange?.();
  };

  const handleExclude = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExclude(restaurant.id);
    onExcludeChange?.();
  };

  const handleMealLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMealLog?.(restaurant);
  };

  const handleToggleReviews = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (showReviews) {
      setShowReviews(false);
      return;
    }

    if (reviews.length > 0) {
      setShowReviews(true);
      return;
    }

    setReviewLoading(true);
    setReviewError(null);

    try {
      const query = encodeURIComponent(name);
      const res = await fetch(`/api/blog-reviews?query=${query}`);
      const data = await res.json();

      if (!res.ok) {
        setReviewError(data.error || '후기를 불러올 수 없습니다.');
      } else if (data.reviews.length === 0) {
        setReviewError('관련 블로그 후기가 없습니다.');
      } else {
        setReviews(data.reviews);
      }
      setShowReviews(true);
    } catch {
      setReviewError('후기를 불러오는 중 오류가 발생했습니다.');
      setShowReviews(true);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-200 border border-gray-100 card-hover">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="font-bold text-sm text-gray-800 leading-tight truncate">{name}</h3>
          {isRecentVisit && (
            <span className="text-[10px] bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 whitespace-nowrap">
              최근 방문
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <span className="text-[11px] bg-[#F5F6FF] text-[#6B77E8] px-2 py-1 rounded-full font-medium">
            {category}
          </span>
          <button
            onClick={handleFavorite}
            className={`p-1 transition-colors ${isFavorite ? 'text-blue-500' : 'text-gray-300 hover:text-blue-400'}`}
            title={isFavorite ? '좋아요 해제' : '좋아요'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zm-9 11H3a1 1 0 01-1-1v-7a1 1 0 011-1h2" />
            </svg>
          </button>
          <button
            onClick={handleExclude}
            className="p-1 text-gray-300 hover:text-red-400 transition-colors"
            title="싫어요"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zm9-13h2a1 1 0 011 1v7a1 1 0 01-1 1h-2" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-gray-400 text-xs mb-2 truncate">{address}</p>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md">
          <svg className="w-3.5 h-3.5 text-[#8B95FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">{distance}m</span>
        </span>

        {rating && (
          <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md">
            <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium">{rating.toFixed(1)}</span>
          </span>
        )}

        {phone && (
          <span className="text-gray-400 text-[11px]">{phone}</span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3">
        {placeUrl && (
          <a
            href={placeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-between px-3 py-2.5 bg-[#F5F6FF] hover:bg-[#ECEEFF] rounded-xl transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#6B77E8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-xs font-medium text-[#6B77E8]">카카오맵에서 보기</span>
            </span>
            <svg className="w-3.5 h-3.5 text-[#8B95FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}
        <button
          onClick={handleToggleReviews}
          disabled={reviewLoading}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors flex-shrink-0 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <span className="text-xs font-medium">
            {reviewLoading ? '로딩...' : '후기'}
          </span>
        </button>
        {onMealLog && (
          <button
            onClick={handleMealLog}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">먹었어요</span>
          </button>
        )}
      </div>

      {showReviews && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          {reviewError ? (
            <p className="text-xs text-gray-400 text-center py-2">{reviewError}</p>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[11px] text-gray-400 font-medium">블로그 후기</p>
              {reviews.map((review, idx) => (
                <a
                  key={idx}
                  href={review.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-medium text-gray-700 leading-snug line-clamp-1">
                    {review.title}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">
                    {review.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-green-500 font-medium">{review.bloggerName}</span>
                    <span className="text-[10px] text-gray-300">{review.date}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
