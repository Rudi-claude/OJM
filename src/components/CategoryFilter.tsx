'use client';

import { Category } from '@/types';

interface CategoryFilterProps {
  selected: Category;
  onChange: (category: Category) => void;
}

const categories: Category[] = ['전체', '한식', '중식', '일식', '양식', '분식', '카페'];

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected === category
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
