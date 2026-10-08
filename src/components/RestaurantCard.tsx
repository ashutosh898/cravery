import { Star, Clock, Bike } from 'lucide-react';
import { Restaurant } from '../types';
import { SafeImage } from './SafeImage';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
}

export function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  const availableItems = restaurant.items.filter((i) => i.isAvailable).length;

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-stone-200/80 rounded-xl overflow-hidden shadow-xs hover:border-stone-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Card Image */}
        <div className="relative h-48 w-full overflow-hidden bg-stone-100">
          <SafeImage
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />

          {!restaurant.isOpen && (
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-stone-900 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">
                Currently Closed
              </span>
            </div>
          )}

          {/* Rating tag */}
          <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded text-xs font-bold text-stone-900 flex items-center gap-1 shadow-xs">
            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
            <span className="tabular-nums">{restaurant.rating.toFixed(1)}</span>
            <span className="text-stone-400 font-normal">({restaurant.reviewCount})</span>
          </div>

          {/* Price Range */}
          <div className="absolute top-2.5 right-2.5 bg-stone-900/80 text-white text-xs font-semibold px-2 py-0.5 rounded backdrop-blur-xs">
            {restaurant.priceRange}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition-colors truncate">
              {restaurant.name}
            </h3>
          </div>

          <p className="text-xs text-stone-600 line-clamp-1">
            {restaurant.tagline}
          </p>

          {/* Unboxed Metadata with Typographic Separator */}
          <div className="flex items-center gap-2 text-xs text-stone-500 pt-1">
            <span className="font-medium text-stone-700">{restaurant.cuisine}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              <span className="tabular-nums">{restaurant.deliveryTimeMinutes} min</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Bike className="w-3 h-3 text-stone-400" />
              <span className="tabular-nums">
                {restaurant.deliveryFee === 0 ? 'Free delivery' : `$${restaurant.deliveryFee.toFixed(2)}`}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <span className="tabular-nums">
          {availableItems} dishes in stock
        </span>
        <span className="text-amber-700 font-medium group-hover:underline">
          View Menu →
        </span>
      </div>
    </div>
  );
}
