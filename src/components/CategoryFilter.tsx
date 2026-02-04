'use client';

import { Category } from '@/types';

interface CategoryFilterProps {
  selected: Category;
  onChange: (category: Category) => void;
}

const categories: { name: Category; icon: string }[] = [
  { name: '전체', icon: '🍽️' },
  { name: '한식', icon: '🍚' },
  { name: '중식', icon: '🥟' },
  { name: '일식', icon: '🍣' },
  { name: '양식', icon: '🍝' },
  { name: '분식', icon: '🍜' },
  { name: '아시안', icon: '🍜' },
  { name: '패스트푸드', icon: '🍔' },
];

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category.name}
          onClick={() => onChange(category.name)}
          className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 ${
            selected === category.name
              ? 'bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white shadow-lg shadow-[#6B77E8]/20'
              : 'bg-white text-gray-600 hover:bg-[#F5F6FF] hover:text-[#6B77E8] border border-gray-100'
          }`}
        >
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
}
