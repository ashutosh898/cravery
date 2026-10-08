import { useState } from 'react';
import { Utensils } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export function SafeImage({ src, alt, className = '', fallbackText }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-stone-100 text-stone-500 border border-stone-200/60 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Utensils className="w-8 h-8 text-stone-400 mb-1" strokeWidth={1.5} />
        <span className="text-xs text-stone-500 font-medium px-2 text-center truncate max-w-full">
          {fallbackText || alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-200/60 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
