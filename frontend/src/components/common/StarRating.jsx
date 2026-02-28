import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, count, size = 'sm', interactive = false, onChange }) {
  const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5">
      {stars.map(star => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:text-amber-400' : ''}`}
          onClick={() => interactive && onChange && onChange(star)}
        />
      ))}
      {count !== undefined && (
        <span className="ml-1 text-sm text-earth-500">({count})</span>
      )}
    </div>
  );
}
