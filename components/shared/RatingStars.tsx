import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}

export default function RatingStars({
  rating,
  onChange,
  readonly = false,
  size = 24
}: RatingStarsProps) {
  const handleClick = (star: number) => {
    if (!readonly && onChange) {
      onChange(star);
    }
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={readonly}
          className={`
            transition-colors
            ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
            ${!readonly && 'hover:opacity-80'}
          `}
          aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}
