import React from 'react';
import { EventCategory } from '../types/Event';

interface EventFiltersProps {
  categories: EventCategory[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

const EventFilters: React.FC<EventFiltersProps> = ({
  categories,
  selectedCategories,
  onCategoryChange
}) => {
  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const handleClearAll = () => {
    onCategoryChange([]);
  };

  const handleSelectAll = () => {
    onCategoryChange(categories.map(c => c.id));
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
        <h3 className="text-sm font-medium text-gray-700">Filter by Category</h3>
        <div className="flex gap-4 sm:gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-700 touch-manipulation"
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            className="text-xs text-gray-600 hover:text-gray-700 touch-manipulation"
          >
            Clear All
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleCategoryToggle(category.id)}
            className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-all touch-manipulation ${
              selectedCategories.includes(category.id)
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="truncate">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventFilters;