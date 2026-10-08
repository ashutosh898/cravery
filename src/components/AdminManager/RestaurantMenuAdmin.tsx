import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  FolderPlus,
  DollarSign,
  Clock,
  Search,
  Sparkles,
  AlertCircle,
  Building2,
  Layers,
  ShoppingBag,
  ExternalLink,
  ChefHat,
} from 'lucide-react';
import {
  Restaurant,
  MenuCategory,
  MenuItem,
  DietaryTag,
  Order,
} from '../../types';
import { SafeImage } from '../SafeImage';
import { api } from '../../api';

interface RestaurantMenuAdminProps {
  restaurants: Restaurant[];
  selectedRestaurantId: string;
  onSelectRestaurant: (id: string) => void;
  onRefreshData: () => Promise<void>;
  onViewCustomerMenu: (restaurantId: string) => void;
  orders: Order[];
}

export function RestaurantMenuAdmin({
  restaurants,
  selectedRestaurantId,
  onSelectRestaurant,
  onRefreshData,
  onViewCustomerMenu,
  orders,
}: RestaurantMenuAdminProps) {
  const currentRestaurant =
    restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];

  // Filters & State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'sold_out'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'kitchen'>('menu');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Modals state
  const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);
  const [showEditRestaurantModal, setShowEditRestaurantModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Loading indicator for async actions
  const [isUpdating, setIsUpdating] = useState(false);

  const showToast = (message: string) => {
    setActionFeedback(message);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // -------------------------------------------------------------
  // AVAILABILITY TOGGLE (JavaScript Core Action)
  // -------------------------------------------------------------
  const handleToggleItemAvailability = async (item: MenuItem) => {
    if (!currentRestaurant) return;
    setIsUpdating(true);
    try {
      const res = await api.toggleItemAvailability(
        currentRestaurant.id,
        item.id,
        !item.isAvailable
      );
      await onRefreshData();
      showToast(
        res.isAvailable
          ? `✓ "${item.name}" is now IN STOCK and available for customer orders.`
          : `✗ "${item.name}" marked SOLD OUT. Ordering is disabled for customers.`
      );
    } catch (err: any) {
      showToast(`Error updating availability: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBatchAvailability = async (targetAvailable: boolean) => {
    if (!currentRestaurant) return;
    setIsUpdating(true);
    try {
      for (const item of currentRestaurant.items) {
        if (item.isAvailable !== targetAvailable) {
          await api.toggleItemAvailability(currentRestaurant.id, item.id, targetAvailable);
        }
      }
      await onRefreshData();
      showToast(
        targetAvailable
          ? `All ${currentRestaurant.items.length} items marked IN STOCK.`
          : `All ${currentRestaurant.items.length} items marked SOLD OUT.`
      );
    } catch (err: any) {
      showToast(`Error batch updating: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleRestaurantStatus = async () => {
    if (!currentRestaurant) return;
    setIsUpdating(true);
    try {
      const res = await api.toggleRestaurantStatus(currentRestaurant.id);
      await onRefreshData();
      showToast(
        res.isOpen
          ? `${currentRestaurant.name} is now OPEN for customer orders.`
          : `${currentRestaurant.name} is now PAUSED (Closed for orders).`
      );
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;
    if (!currentRestaurant) return;
    setIsUpdating(true);
    try {
      await api.deleteMenuItem(currentRestaurant.id, itemId);
      await onRefreshData();
      showToast(`Item "${itemName}" removed from menu.`);
    } catch (err: any) {
      showToast(`Error deleting item: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete category "${catName}"? Any menu items in this category will also be deleted.`
      )
    )
      return;
    if (!currentRestaurant) return;
    setIsUpdating(true);
    try {
      await api.deleteCategory(currentRestaurant.id, catId);
      await onRefreshData();
      showToast(`Category "${catName}" and associated items deleted.`);
    } catch (err: any) {
      showToast(`Error deleting category: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdvanceOrderStatus = async (orderId: string, currentStatus: Order['status']) => {
    const nextStatusMap: Record<Order['status'], Order['status']> = {
      placed: 'confirmed',
      confirmed: 'preparing',
      preparing: 'on_the_way',
      on_the_way: 'delivered',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    const nextStatus = nextStatusMap[currentStatus];
    if (nextStatus === currentStatus) return;

    try {
      await api.updateOrderStatus(orderId, nextStatus);
      await onRefreshData();
      showToast(`Order status updated to: ${nextStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      showToast(`Failed to update order: ${err.message}`);
    }
  };

  // Filtered Menu Items
  const filteredItems = (currentRestaurant?.items || []).filter((item) => {
    if (selectedCategoryFilter !== 'all' && item.categoryId !== selectedCategoryFilter) {
      return false;
    }
    if (availabilityFilter === 'available' && !item.isAvailable) return false;
    if (availabilityFilter === 'sold_out' && item.isAvailable) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const availableCount = (currentRestaurant?.items || []).filter((i) => i.isAvailable).length;
  const soldOutCount = (currentRestaurant?.items || []).filter((i) => !i.isAvailable).length;
  const restaurantOrders = orders.filter((o) => o.restaurantId === currentRestaurant?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {actionFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-3 animate-fade-in border border-stone-700">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Header & Restaurant Selector Bar */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Partner & Administrator Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Restaurant & Menu Management
            </h1>
            <p className="text-sm text-stone-600 mt-0.5">
              Configure restaurant settings, organize menu categories, add dishes, and manage real-time item availability.
            </p>
          </div>

          {/* Restaurant Switcher & Add Restaurant Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="restaurant-select" className="text-xs font-semibold text-stone-600 whitespace-nowrap">
                Select Restaurant:
              </label>
              <select
                id="restaurant-select"
                value={selectedRestaurantId}
                onChange={(e) => onSelectRestaurant(e.target.value)}
                className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.cuisine})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddRestaurantModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Restaurant</span>
            </button>
          </div>
        </div>

        {/* Selected Restaurant Overview Card */}
        {currentRestaurant && (
          <div className="pt-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
            <div className="lg:col-span-2 flex items-start gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                <SafeImage
                  src={currentRestaurant.imageUrl}
                  alt={currentRestaurant.name}
                  className="w-full h-full"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-stone-900">{currentRestaurant.name}</h2>
                  <span className="text-xs text-stone-500 font-medium">{currentRestaurant.priceRange}</span>
                </div>
                <p className="text-xs text-stone-600 line-clamp-1">{currentRestaurant.tagline}</p>
                <div className="flex items-center gap-3 text-xs text-stone-500 pt-1">
                  <span>{currentRestaurant.cuisine}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentRestaurant.address}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentRestaurant.deliveryTimeMinutes} min delivery</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center bg-stone-50 p-3 rounded-lg border border-stone-200/60">
              <div>
                <div className="text-xs text-stone-500">Total Items</div>
                <div className="text-lg font-bold text-stone-900 tabular-nums">
                  {currentRestaurant.items.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-emerald-700 font-medium">In Stock</div>
                <div className="text-lg font-bold text-emerald-700 tabular-nums">
                  {availableCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-rose-700 font-medium">Sold Out</div>
                <div className="text-lg font-bold text-rose-700 tabular-nums">
                  {soldOutCount}
                </div>
              </div>
            </div>

            {/* Restaurant Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 justify-end">
              <button
                onClick={handleToggleRestaurantStatus}
                disabled={isUpdating}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  currentRestaurant.isOpen
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                }`}
              >
                {currentRestaurant.isOpen ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Restaurant OPEN for Orders</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Restaurant CLOSED / Paused</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEditRestaurantModal(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={() => onViewCustomerMenu(currentRestaurant.id)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg cursor-pointer"
                  title="View customer menu"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Customer View</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'menu'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Menu Items ({currentRestaurant?.items.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories ({currentRestaurant?.categories.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('kitchen')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'kitchen'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Active Orders ({restaurantOrders.length})</span>
          </button>
        </div>

        {activeTab === 'menu' && (
          <button
            onClick={() => setShowAddItemModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Food Item</span>
          </button>
        )}

        {activeTab === 'categories' && (
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {/* --------------------------------------------------------- */}
      {/* TAB 1: MENU ITEMS & REAL-TIME AVAILABILITY MANAGEMENT */}
      {/* --------------------------------------------------------- */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500">Category:</span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-300 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {(currentRestaurant?.categories || []).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Availability Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500">Availability:</span>
                <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                  <button
                    onClick={() => setAvailabilityFilter('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      availabilityFilter === 'all'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All ({currentRestaurant?.items.length || 0})
                  </button>
                  <button
                    onClick={() => setAvailabilityFilter('available')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      availabilityFilter === 'available'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    In Stock ({availableCount})
                  </button>
                  <button
                    onClick={() => setAvailabilityFilter('sold_out')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      availabilityFilter === 'sold_out'
                        ? 'bg-white text-rose-800 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Sold Out ({soldOutCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Batch Actions */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 border-l border-stone-200 pl-3">
                <button
                  onClick={() => handleBatchAvailability(true)}
                  disabled={isUpdating}
                  className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer border border-emerald-200"
                  title="Mark all items as In Stock"
                >
                  All In Stock
                </button>
                <button
                  onClick={() => handleBatchAvailability(false)}
                  disabled={isUpdating}
                  className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer border border-rose-200"
                  title="Mark all items as Sold Out"
                >
                  All Sold Out
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items Table / Cards */}
          {filteredItems.length === 0 ? (
            <div className="bg-white border border-stone-200/80 rounded-xl p-12 text-center">
              <AlertCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-stone-900">No menu items found</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                No items match your filter criteria. Click "Add Food Item" above to add new culinary creations.
              </p>
              <button
                onClick={() => setShowAddItemModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Food Item</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const category = currentRestaurant?.categories.find((c) => c.id === item.categoryId);
                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-xl overflow-hidden shadow-xs transition-all flex flex-col justify-between ${
                      item.isAvailable
                        ? 'border-stone-200/80 hover:border-stone-300 hover:shadow-sm'
                        : 'border-rose-200 bg-stone-50/70'
                    }`}
                  >
                    <div>
                      {/* Image with Availability Overlay */}
                      <div className="relative h-44 w-full">
                        <SafeImage
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider shadow-md">
                              Sold Out
                            </span>
                          </div>
                        )}
                        <div className="absolute top-2.5 right-2.5 bg-stone-900/80 text-white text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm tabular-nums">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-amber-700 font-semibold truncate">
                            {category?.name || 'Uncategorized'}
                          </span>
                          <span className="text-xs text-stone-500 tabular-nums flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.preparationTimeMinutes} min
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-stone-900 leading-snug">
                          {item.name}
                        </h3>

                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {item.description || 'No description provided.'}
                        </p>

                        {/* Dietary tags as clean unboxed text with dot separators */}
                        {item.dietaryTags && item.dietaryTags.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 pt-1">
                            {item.dietaryTags.map((tag, i) => (
                              <React.Fragment key={tag}>
                                <span className="capitalize">{tag.replace('_', ' ')}</span>
                                {i < item.dietaryTags.length - 1 && (
                                  <span aria-hidden="true" className="text-stone-300">·</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Availability Switch & Actions */}
                    <div className="p-3 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between">
                      {/* Availability Toggle Switch */}
                      <button
                        onClick={() => handleToggleItemAvailability(item)}
                        disabled={isUpdating}
                        className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer border ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle availability"
                      >
                        {item.isAvailable ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-rose-600" />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>

                      {/* Edit & Delete Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded transition-colors cursor-pointer"
                          title="Edit item details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* TAB 2: MENU CATEGORIES MANAGEMENT */}
      {/* --------------------------------------------------------- */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-stone-200/80 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Menu Categories</h2>
              <p className="text-xs text-stone-600">
                Organize menu items into distinct courses and sections for customers.
              </p>
            </div>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Category</span>
            </button>
          </div>

          <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden">
            {(currentRestaurant?.categories || []).map((cat, idx) => {
              const itemCount = (currentRestaurant?.items || []).filter(
                (i) => i.categoryId === cat.id
              ).length;
              return (
                <div
                  key={cat.id}
                  className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{cat.name}</h4>
                      <p className="text-xs text-stone-500">{cat.description || 'No description'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-stone-500 tabular-nums">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* TAB 3: KITCHEN & ACTIVE ORDERS QUEUE */}
      {/* --------------------------------------------------------- */}
      {activeTab === 'kitchen' && (
        <div className="bg-white border border-stone-200/80 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Kitchen & Order Flow</h2>
              <p className="text-xs text-stone-600">
                Live orders received for {currentRestaurant?.name}. Manage preparation stages in real time.
              </p>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              Auto-sync enabled
            </span>
          </div>

          {restaurantOrders.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              No orders yet for this restaurant. Place an order from the customer view to test live updates!
            </div>
          ) : (
            <div className="space-y-4">
              {restaurantOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-stone-200 rounded-lg p-4 bg-stone-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                    <div>
                      <span className="font-bold text-stone-900 text-sm">{order.orderNumber}</span>
                      <span className="text-xs text-stone-500 ml-2">
                        {order.customerName} · {order.customerPhone}
                      </span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-stone-700">
                        <span>
                          {item.quantity}x {item.name}{' '}
                          {item.optionsSummary && (
                            <span className="text-stone-500">({item.optionsSummary})</span>
                          )}
                        </span>
                        <span className="tabular-nums font-medium">${item.itemTotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 text-xs">
                    <span className="text-stone-500">
                      Address: <strong className="text-stone-700">{order.deliveryAddress}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 tabular-nums">
                        Total: ${order.total.toFixed(2)}
                      </span>
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => handleAdvanceOrderStatus(order.id, order.status)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          Advance to Next Stage →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD NEW RESTAURANT */}
      {/* ------------------------------------------------------------- */}
      {showAddRestaurantModal && (
        <AddRestaurantModal
          onClose={() => setShowAddRestaurantModal(false)}
          onSubmit={async (data) => {
            setIsUpdating(true);
            try {
              const created = await api.createRestaurant(data);
              await onRefreshData();
              onSelectRestaurant(created.id);
              setShowAddRestaurantModal(false);
              showToast(`✓ Restaurant "${created.name}" created successfully.`);
            } catch (err: any) {
              alert(err.message);
            } finally {
              setIsUpdating(false);
            }
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT RESTAURANT */}
      {/* ------------------------------------------------------------- */}
      {showEditRestaurantModal && currentRestaurant && (
        <EditRestaurantModal
          restaurant={currentRestaurant}
          onClose={() => setShowEditRestaurantModal(false)}
          onSubmit={async (data) => {
            setIsUpdating(true);
            try {
              await api.updateRestaurant(currentRestaurant.id, data);
              await onRefreshData();
              setShowEditRestaurantModal(false);
              showToast(`✓ Restaurant "${data.name}" updated successfully.`);
            } catch (err: any) {
              alert(err.message);
            } finally {
              setIsUpdating(false);
            }
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* ------------------------------------------------------------- */}
      {(showAddCategoryModal || editingCategory) && currentRestaurant && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowAddCategoryModal(false);
            setEditingCategory(null);
          }}
          onSubmit={async (catData) => {
            setIsUpdating(true);
            try {
              if (editingCategory) {
                await api.updateCategory(currentRestaurant.id, editingCategory.id, catData);
                showToast(`✓ Category "${catData.name}" updated.`);
              } else {
                await api.createCategory(currentRestaurant.id, catData);
                showToast(`✓ New category "${catData.name}" created.`);
              }
              await onRefreshData();
              setShowAddCategoryModal(false);
              setEditingCategory(null);
            } catch (err: any) {
              alert(err.message);
            } finally {
              setIsUpdating(false);
            }
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT MENU ITEM */}
      {/* ------------------------------------------------------------- */}
      {(showAddItemModal || editingItem) && currentRestaurant && (
        <MenuItemModal
          item={editingItem}
          categories={currentRestaurant.categories}
          onClose={() => {
            setShowAddItemModal(false);
            setEditingItem(null);
          }}
          onSubmit={async (itemData) => {
            setIsUpdating(true);
            try {
              if (editingItem) {
                await api.updateMenuItem(currentRestaurant.id, editingItem.id, itemData);
                showToast(`✓ Menu item "${itemData.name}" updated.`);
              } else {
                await api.createMenuItem(currentRestaurant.id, itemData);
                showToast(`✓ New dish "${itemData.name}" added to menu.`);
              }
              await onRefreshData();
              setShowAddItemModal(false);
              setEditingItem(null);
            } catch (err: any) {
              alert(err.message);
            } finally {
              setIsUpdating(false);
            }
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// MODAL COMPONENTS
// -------------------------------------------------------------------

interface AddRestaurantModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<Restaurant>) => Promise<void>;
}

function AddRestaurantModal({ onClose, onSubmit }: AddRestaurantModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    cuisine: 'Artisanal Pizza',
    address: '500 Central Gourmet Blvd',
    phone: '+1 (555) 443-8901',
    deliveryTimeMinutes: 25,
    deliveryFee: 2.99,
    minimumOrder: 15.0,
    priceRange: '$$' as '$' | '$$' | '$$$' | '$$$$',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <h3 className="text-lg font-bold text-stone-900">Add New Restaurant</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Osteria Napoli"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cuisine Specialty *
              </label>
              <input
                type="text"
                required
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                placeholder="e.g. Italian & Pasta"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g. Woodfired artisanal pizzas with organic heirloom wheat"
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell customers about your kitchen philosophy..."
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Delivery Time (min)
              </label>
              <input
                type="number"
                min={10}
                max={120}
                value={formData.deliveryTimeMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryTimeMinutes: Number(e.target.value) })
                }
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Delivery Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Price Tier
              </label>
              <select
                value={formData.priceRange}
                onChange={(e) =>
                  setFormData({ ...formData, priceRange: e.target.value as '$' | '$$' | '$$$' | '$$$$' })
                }
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="$">$ (Budget-friendly)</option>
                <option value="$$">$$ (Standard)</option>
                <option value="$$$">$$$ (Fine Casual)</option>
                <option value="$$$$">$$$$ (Gourmet Luxury)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Storefront Image URL
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer shadow-sm"
            >
              {loading ? 'Creating...' : 'Create Restaurant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRestaurantModal({
  restaurant,
  onClose,
  onSubmit,
}: {
  restaurant: Restaurant;
  onClose: () => void;
  onSubmit: (data: Partial<Restaurant>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: restaurant.name,
    tagline: restaurant.tagline,
    description: restaurant.description,
    cuisine: restaurant.cuisine,
    deliveryTimeMinutes: restaurant.deliveryTimeMinutes,
    deliveryFee: restaurant.deliveryFee,
    minimumOrder: restaurant.minimumOrder,
    address: restaurant.address,
    phone: restaurant.phone,
    priceRange: restaurant.priceRange,
    imageUrl: restaurant.imageUrl,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <h3 className="text-lg font-bold text-stone-900">Edit Restaurant Details</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Cuisine</label>
            <input
              type="text"
              value={formData.cuisine}
              onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Delivery Time (min)
              </label>
              <input
                type="number"
                value={formData.deliveryTimeMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryTimeMinutes: Number(e.target.value) })
                }
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Delivery Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer shadow-sm"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryModal({
  category,
  onClose,
  onSubmit,
}: {
  category: MenuCategory | null;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <h3 className="text-base font-bold text-stone-900">
            {category ? 'Edit Category' : 'Create Menu Category'}
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Starters & Crudo, Artisan Pizzas"
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Description (optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief note about dishes in this section..."
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer shadow-sm"
            >
              {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MenuItemModal({
  item,
  categories,
  onClose,
  onSubmit,
}: {
  item: MenuItem | null;
  categories: MenuCategory[];
  onClose: () => void;
  onSubmit: (data: Partial<MenuItem>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    categoryId: item?.categoryId || (categories[0]?.id || ''),
    price: item?.price !== undefined ? item.price : 14.5,
    preparationTimeMinutes: item?.preparationTimeMinutes || 15,
    description: item?.description || '',
    imageUrl:
      item?.imageUrl ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    isAvailable: item?.isAvailable !== undefined ? item.isAvailable : true,
    dietaryTags: (item?.dietaryTags || []) as DietaryTag[],
  });

  const [loading, setLoading] = useState(false);

  const availableTags: { tag: DietaryTag; label: string }[] = [
    { tag: 'vegetarian', label: 'Vegetarian' },
    { tag: 'vegan', label: 'Vegan' },
    { tag: 'gluten_free', label: 'Gluten-Free' },
    { tag: 'halal', label: 'Halal' },
    { tag: 'spicy', label: 'Spicy' },
    { tag: 'dairy_free', label: 'Dairy-Free' },
  ];

  const toggleTag = (tag: DietaryTag) => {
    if (formData.dietaryTags.includes(tag)) {
      setFormData({
        ...formData,
        dietaryTags: formData.dietaryTags.filter((t) => t !== tag),
      });
    } else {
      setFormData({
        ...formData,
        dietaryTags: [...formData.dietaryTags, tag],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) return;
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <h3 className="text-lg font-bold text-stone-900">
            {item ? 'Edit Food Item' : 'Add Food Item to Menu'}
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Dish Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Truffle Pappardelle"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Prep Time (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={formData.preparationTimeMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, preparationTimeMinutes: Number(e.target.value) })
                }
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Description & Ingredients
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Fresh egg pasta, black summer truffles, butter emulsion, aged parmesan..."
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Food Image URL
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Initial Availability State */}
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-900 block">Item Availability</span>
              <span className="text-xs text-stone-500">
                Can customers currently order this item?
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                formData.isAvailable
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {formData.isAvailable ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>In Stock</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Sold Out</span>
                </>
              )}
            </button>
          </div>

          {/* Dietary tags */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Dietary Indicators
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(({ tag, label }) => {
                const isSelected = formData.dietaryTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer shadow-sm"
            >
              {loading ? 'Saving...' : item ? 'Update Item' : 'Add to Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
