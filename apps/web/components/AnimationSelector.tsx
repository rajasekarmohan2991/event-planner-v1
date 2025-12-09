'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_ANIMATIONS, AnimationConfig, getAnimationsByCategory, getAvailableCategories } from '@/lib/animations/animations';
import { Player } from '@lottiefiles/react-lottie-player';

interface AnimationSelectorProps {
  selectedCategory: string;
  onSelect: (animation: AnimationConfig) => void;
  currentAnimationId?: string;
}

export function AnimationSelector({
  selectedCategory,
  onSelect,
  currentAnimationId,
}: AnimationSelectorProps) {
  const [animations, setAnimations] = useState<AnimationConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(currentAnimationId || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    const categoryAnimations = getAnimationsByCategory(selectedCategory);
    setAnimations(categoryAnimations);
    setIsLoading(false);
  }, [selectedCategory]);

  const handleSelect = (animation: AnimationConfig) => {
    setSelectedId(animation.id);
    onSelect(animation);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse h-40" />
        ))}
      </div>
    );
  }

  if (animations.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No animations found for this category. Try selecting a different category.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {animations.map((animation) => (
        <motion.div
          key={animation.id}
          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
            selectedId === animation.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelect(animation)}
        >
          <div className="h-32 bg-gray-50 flex items-center justify-center">
            <Player
              autoplay
              loop
              src={animation.source}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <div className="p-2 bg-white">
            <h4 className="text-sm font-medium text-gray-900 truncate">{animation.name}</h4>
            <p className="text-xs text-gray-500">By {animation.author}</p>
          </div>
          {selectedId === animation.id && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              ✓
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Animation category selector
export function AnimationCategorySelector({
  onSelectCategory,
  selectedCategory,
}: {
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
}) {
  const categories = getAvailableCategories();

  return (
    <div className="flex flex-wrap gap-2 p-4 border-b">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            selectedCategory === category
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
