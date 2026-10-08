import { useState } from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Restaurant } from '../types';
import { RestaurantCard } from './RestaurantCard';

interface CustomerExploreViewProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenAdmin: () => void;
}

export function CustomerExploreView({
  restaurants,
  onSelectRestaurant,
  onOpenAdmin,
}: CustomerExploreViewProps) {
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);

  const cuisines = [
    { id: 'all', label: 'All Cuisines' },
    { id: 'Italian & Pizza', label: 'Artisanal Pizza' },
    { id: 'Gourmet Burgers', label: 'Craft Burgers' },
    { id: 'Japanese & Ramen', label: 'Ramen & Sushi' },
    { id: 'Healthy & Bowls', label: 'Organic Bowls' },
  ];

  const filteredRestaurants = restaurants.filter((r) => {
    if (selectedCuisine !== 'all' && !r.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase())) {
      return false;
    }
    if (onlyOpen && !r.isOpen) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchCuisine = r.cuisine.toLowerCase().includes(q);
      const matchItems = r.items.some(
        (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
      return matchName || matchCuisine || matchItems;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-stone-900 text-white p-8 sm:p-12 border border-stone-800 shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/60 to-transparent" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Artisanal Dining</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Exceptional Food, Crafted Fresh to Your Door.
          </h1>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Order directly from local culinary craftsmen. Real-time kitchen tracking, transparent ingredients, and instant menu customization.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAdmin}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
            >
              Open Restaurant & Menu Manager →
            </button>
          </div>
        </div>
      </div>

      {/* Discovery & Search Bar */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search restaurants, dishes (e.g. Margherita, Truffle, Ramen, Gyoza)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <button
            onClick={() => setOnlyOpen(!onlyOpen)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              onlyOpen
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Open Now Only</span>
          </button>
        </div>

        {/* Cuisine Filter Segmented Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {cuisines.map((c) => {
            const isActive = selectedCuisine === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCuisine(c.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">
            Available Kitchens ({filteredRestaurants.length})
          </h2>
          <span className="text-xs text-stone-500">
            {filteredRestaurants.reduce((sum, r) => sum + r.items.length, 0)} dishes available
          </span>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-16 text-center text-stone-500 space-y-2">
            <p className="text-sm font-semibold">No kitchens found matching your filter</p>
            <p className="text-xs text-stone-400">
              Try adjusting your search query or selecting "All Cuisines".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={() => onSelectRestaurant(restaurant)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
