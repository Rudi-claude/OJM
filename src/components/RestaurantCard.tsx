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
          className="mt-3 flex items-center justify-between w-full px-3 py-2.5 bg-[#F5F6FF] hover:bg-[#ECEEFF] rounded-xl transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6B77E8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-xs font-medium text-[#6B77E8]">카카오맵에서 메뉴·사진·후기 보기</span>
          </span>
          <svg className="w-3.5 h-3.5 text-[#8B95FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}
    </div>
  );
}
