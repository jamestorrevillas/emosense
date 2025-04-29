// src/components/videoReview/QuickRating.tsx
import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { QuickRatingSettings } from '@/types/videoReview';

interface QuickRatingProps {
  settings: QuickRatingSettings;
  onRate?: (value: number) => void;
  disabled?: boolean;
}

export const QuickRating = ({
  settings,
  onRate,
  disabled = false
}: QuickRatingProps) => {
  const [value, setValue] = useState<number | null>(null);
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleRate = (newValue: number) => {
    if (disabled) return;
    setValue(newValue);
    onRate?.(newValue);
  };

  const renderRatingInput = () => {
    switch (settings.type) {
      case 'stars':
        return (
          <div className="flex gap-1">
            {Array.from(
              { length: settings.scale.max - settings.scale.min + 1 },
              (_, i) => settings.scale.min + i
            ).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoverValue(star)}
                onMouseLeave={() => setHoverValue(null)}
                className={cn(
                  "text-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  "transition-all duration-200 transform",
                  disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110",
                  (hoverValue !== null ? star <= hoverValue : star <= (value || 0))
                    ? "text-yellow-400"
                    : "text-gray-300"
                )}
                disabled={disabled}
              >
                <Star 
                  className={cn(
                    "w-8 h-8 transition-all duration-200",
                    (hoverValue !== null ? star <= hoverValue : star <= (value || 0))
                      ? "fill-current drop-shadow-md"
                      : "fill-none hover:text-yellow-300"
                  )} 
                />
              </button>
            ))}
          </div>
        );

      case 'numeric':
        return (
          <div className="flex gap-2 flex-wrap justify-center">
            {Array.from(
              { length: (settings.scale.max - settings.scale.min) / (settings.scale.step || 1) + 1 },
              (_, i) => settings.scale.min + i * (settings.scale.step || 1)
            ).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleRate(num)}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  disabled ? "cursor-not-allowed opacity-50" : 
                  value === num 
                    ? "border-primary bg-primary text-primary-foreground scale-110 shadow-md" 
                    : "border-gray-200 hover:border-primary hover:text-primary hover:scale-110 hover:shadow-md"
                )}
                disabled={disabled}
              >
                {num}
              </button>
            ))}
          </div>
        );

      case 'thumbs':
        return (
          <div className="flex gap-8 justify-center">
            <button
              type="button"
              onClick={() => handleRate(0)}
              className={cn(
                "text-2xl p-3 rounded-full transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                disabled ? "cursor-not-allowed opacity-50" :
                value === 0
                  ? "text-destructive bg-destructive/10 scale-110 shadow-md"
                  : "text-gray-400 hover:text-destructive hover:bg-destructive/10 hover:scale-110 hover:shadow-md"
              )}
              disabled={disabled}
            >
              <ThumbsDown className="w-8 h-8" />
            </button>
            <button
              type="button"
              onClick={() => handleRate(1)}
              className={cn(
                "text-2xl p-3 rounded-full transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                disabled ? "cursor-not-allowed opacity-50" :
                value === 1
                  ? "text-primary bg-primary/10 scale-110 shadow-md"
                  : "text-gray-400 hover:text-primary hover:bg-primary/10 hover:scale-110 hover:shadow-md"
              )}
              disabled={disabled}
            >
              <ThumbsUp className="w-8 h-8" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{settings.title}</CardTitle>
        {settings.description && (
          <CardDescription>{settings.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {renderRatingInput()}
        {settings.labels && (
          <div className="flex justify-between w-full text-sm text-muted-foreground mt-2">
            <span className="transition-colors duration-200 hover:text-foreground">
              {settings.labels.low}
            </span>
            <span className="transition-colors duration-200 hover:text-foreground">
              {settings.labels.high}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};