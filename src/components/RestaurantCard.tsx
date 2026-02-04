'use client';

import { Restaurant } from '@/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const { name, category, address, distance, rating, phone, placeUrl } = restaurant;

  return (
    <div className="bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-200 border border-gray-100 card-hover">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-sm text-gray-800 leading-tight">{name}</h3>
        <span className="text-[11px] bg-[#F5F6FF] text-[#6B77E8] px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2">
          {category}
        </span>
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

      {placeUrl && (
        <a
          href={placeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-[#6B77E8] hover:text-[#5A66D6] font-medium"
        >
          자세히 보기
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}
    </div>
  );
}
