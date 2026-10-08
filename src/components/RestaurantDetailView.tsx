import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  Clock,
  Bike,
  Plus,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Restaurant, MenuItem, CartItem } from '../types';
import { SafeImage } from './SafeImage';

interface RestaurantDetailViewProps {
  restaurant: Restaurant;
  onBack: () => void;
  onAddToCart: (item: MenuItem, selectedChoices?: { [key: string]: string[] }, notes?: string) => void;
  onOpenAdmin: (restaurantId: string) => void;
}

export function RestaurantDetailView({
  restaurant,
  onBack,
  onAddToCart,
  onOpenAdmin,
}: RestaurantDetailViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeCustomizingItem, setActiveCustomizingItem] = useState<MenuItem | null>(null);

  const filteredItems = restaurant.items.filter((item) => {
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Back button & quick admin shortcut */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Restaurants</span>
        </button>

        <button
          onClick={() => onOpenAdmin(restaurant.id)}
          className="text-xs font-medium text-amber-700 hover:text-amber-800 underline cursor-pointer"
        >
          Manage this restaurant's menu in Console →
        </button>
      </div>

      {/* Hero Banner & Restaurant Info Header */}
      <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="relative h-64 sm:h-72 w-full bg-stone-900">
          <SafeImage
            src={restaurant.bannerUrl || restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />

          {/* Overlay details */}
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-300">
                {restaurant.cuisine}
              </span>
              <span aria-hidden="true" className="text-stone-400">·</span>
              <span className="text-xs text-stone-300">{restaurant.priceRange}</span>
              {!restaurant.isOpen && (
                <span className="bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                  Closed for Orders
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {restaurant.name}
            </h1>

            <p className="text-xs sm:text-sm text-stone-200 max-w-2xl">
              {restaurant.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-300 pt-2 border-t border-stone-800">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="tabular-nums">{restaurant.rating.toFixed(1)}</span> ({restaurant.reviewCount} reviews)
              </span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span className="tabular-nums">{restaurant.deliveryTimeMinutes} min delivery</span>
              </span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span className="flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-stone-400" />
                <span className="tabular-nums">
                  {restaurant.deliveryFee === 0 ? 'Free delivery' : `$${restaurant.deliveryFee.toFixed(2)} delivery`}
                </span>
              </span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span>Min. Order ${restaurant.minimumOrder.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Full Menu ({restaurant.items.length})
        </button>

        {restaurant.categories.map((cat) => {
          const count = restaurant.items.filter((i) => i.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Menu Dishes Grid */}
      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-12 text-center text-stone-500">
            <AlertCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-sm font-semibold">No dishes in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                  item.isAvailable
                    ? 'border-stone-200/80 hover:border-stone-300 hover:shadow-sm'
                    : 'border-stone-200 opacity-75 bg-stone-50'
                }`}
              >
                <div>
                  {/* Dish Image */}
                  <div className="relative h-44 w-full bg-stone-100">
                    <SafeImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Price Tag */}
                    <div className="absolute top-2.5 right-2.5 bg-stone-900/85 text-white text-xs font-bold px-2 py-0.5 rounded backdrop-blur-xs tabular-nums">
                      ${item.price.toFixed(2)}
                    </div>

                    {/* SOLD OUT OVERLAY (Crucial for Availability Management) */}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider shadow-md">
                          Currently Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dish Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="tabular-nums flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {item.preparationTimeMinutes} min
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 leading-snug">
                      {item.name}
                    </h3>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {item.description || 'Artisanal dish prepared fresh with curated ingredients.'}
                    </p>

                    {/* Dietary indicators */}
                    {item.dietaryTags && item.dietaryTags.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 pt-1">
                        {item.dietaryTags.map((tag, idx) => (
                          <React.Fragment key={tag}>
                            <span className="capitalize">{tag.replace('_', ' ')}</span>
                            {idx < item.dietaryTags.length - 1 && (
                              <span aria-hidden="true" className="text-stone-300">·</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-900 tabular-nums">
                    ${item.price.toFixed(2)}
                  </span>

                  {item.isAvailable ? (
                    <button
                      onClick={() => {
                        if (item.options && item.options.length > 0) {
                          setActiveCustomizingItem(item);
                        } else {
                          onAddToCart(item);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{item.options && item.options.length > 0 ? 'Customize & Add' : 'Add to Bag'}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-3 py-1.5 bg-stone-200 text-stone-500 text-xs font-semibold rounded-lg cursor-not-allowed"
                    >
                      Sold Out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dish Customization Modal */}
      {activeCustomizingItem && (
        <DishCustomizerModal
          item={activeCustomizingItem}
          onClose={() => setActiveCustomizingItem(null)}
          onConfirm={(choices, notes) => {
            onAddToCart(activeCustomizingItem, choices, notes);
            setActiveCustomizingItem(null);
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// CUSTOMIZER MODAL
// -------------------------------------------------------------------

interface DishCustomizerModalProps {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (choices: { [key: string]: string[] }, notes: string) => void;
}

function DishCustomizerModal({ item, onClose, onConfirm }: DishCustomizerModalProps) {
  const [selectedChoices, setSelectedChoices] = useState<{ [optionName: string]: string[] }>(() => {
    const initial: { [key: string]: string[] } = {};
    (item.options || []).forEach((opt) => {
      if (opt.required && opt.choices.length > 0) {
        initial[opt.name] = [opt.choices[0].name];
      } else {
        initial[opt.name] = [];
      }
    });
    return initial;
  });

  const [notes, setNotes] = useState('');

  const calculateTotal = () => {
    let sum = item.price;
    (item.options || []).forEach((opt) => {
      const selected = selectedChoices[opt.name] || [];
      selected.forEach((choiceName) => {
        const found = opt.choices.find((c) => c.name === choiceName);
        if (found) sum += found.priceDelta;
      });
    });
    return sum;
  };

  const handleToggleChoice = (optName: string, choiceName: string, maxSelect: number) => {
    const current = selectedChoices[optName] || [];
    if (maxSelect === 1) {
      setSelectedChoices({ ...selectedChoices, [optName]: [choiceName] });
    } else {
      if (current.includes(choiceName)) {
        setSelectedChoices({
          ...selectedChoices,
          [optName]: current.filter((c) => c !== choiceName),
        });
      } else {
        if (current.length < maxSelect) {
          setSelectedChoices({
            ...selectedChoices,
            [optName]: [...current, choiceName],
          });
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h3 className="text-base font-bold text-stone-900">{item.name}</h3>
            <p className="text-xs text-stone-500">Customize your dish selections</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4">
          {(item.options || []).map((opt) => (
            <div key={opt.id} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800">{opt.name}</span>
                <span className="text-stone-500">
                  {opt.required ? 'Required' : `Optional (max ${opt.maxSelect})`}
                </span>
              </div>

              <div className="space-y-1.5">
                {opt.choices.map((choice) => {
                  const isChecked = (selectedChoices[opt.name] || []).includes(choice.name);
                  return (
                    <label
                      key={choice.id}
                      onClick={() => handleToggleChoice(opt.name, choice.name, opt.maxSelect)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-amber-600 bg-amber-50/50 text-stone-900 font-semibold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isChecked
                              ? 'border-amber-600 bg-amber-600 text-white'
                              : 'border-stone-300'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>{choice.name}</span>
                      </div>
                      <span className="tabular-nums text-stone-600">
                        {choice.priceDelta > 0 ? `+$${choice.priceDelta.toFixed(2)}` : 'Included'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Special Kitchen Instructions
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dressing on the side, no onions"
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 block">Total</span>
            <span className="text-base font-bold text-stone-900 tabular-nums">
              ${calculateTotal().toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => onConfirm(selectedChoices, notes)}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm cursor-pointer"
          >
            Add to Bag (${calculateTotal().toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
}
