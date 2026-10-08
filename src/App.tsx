import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CustomerExploreView } from './components/CustomerExploreView';
import { RestaurantDetailView } from './components/RestaurantDetailView';
import { RestaurantMenuAdmin } from './components/AdminManager/RestaurantMenuAdmin';
import { MongoLoginLogsView } from './components/AdminManager/MongoLoginLogsView';
import { OrdersView } from './components/OrdersView';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { Restaurant, MenuItem, CartItem, Order, User } from './types';
import { api } from './api';

export default function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'customer' | 'admin' | 'orders' | 'mongo_logs'>('customer');
  const [selectedAdminRestaurantId, setSelectedAdminRestaurantId] = useState<string>('');
  const [activeDetailRestaurant, setActiveDetailRestaurant] = useState<Restaurant | null>(null);

  // Authentication State (MongoDB User)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cravery_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fetch initial data from Express backend
  const refreshData = useCallback(async () => {
    try {
      const [fetchedRestaurants, fetchedOrders] = await Promise.all([
        api.getRestaurants(),
        api.getOrders(),
      ]);
      setRestaurants(fetchedRestaurants);
      setOrders(fetchedOrders);

      if (fetchedRestaurants.length > 0 && !selectedAdminRestaurantId) {
        setSelectedAdminRestaurantId(fetchedRestaurants[0].id);
      }

      // If active restaurant detail is open, refresh its data
      if (activeDetailRestaurant) {
        const updatedActive = fetchedRestaurants.find(
          (r) => r.id === activeDetailRestaurant.id
        );
        if (updatedActive) {
          setActiveDetailRestaurant(updatedActive);
        }
      }
    } catch (err) {
      console.error('Error fetching data from backend:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAdminRestaurantId, activeDetailRestaurant]);

  useEffect(() => {
    refreshData();
  }, []);

  const handleAuthSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('cravery_current_user', JSON.stringify(user));
      localStorage.setItem('cravery_session_token', token);
    } catch (err) {
      console.error('Local storage save error:', err);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('cravery_current_user');
      localStorage.removeItem('cravery_session_token');
    } catch (err) {
      console.error('Local storage clear error:', err);
    }
  };

  // Cart Handlers
  const handleAddToCart = (
    item: MenuItem,
    selectedChoices: { [key: string]: string[] } = {},
    specialInstructions = ''
  ) => {
    const parentRestaurant = restaurants.find((r) => r.id === item.restaurantId);
    if (!parentRestaurant) return;

    // Check if adding from a different restaurant
    if (cart.length > 0 && cart[0].restaurantId !== item.restaurantId) {
      const confirmSwitch = confirm(
        `Your bag contains dishes from "${cart[0].restaurantName}". Starting a new order from "${parentRestaurant.name}" will clear your previous bag. Continue?`
      );
      if (!confirmSwitch) return;
      setCart([]);
    }

    // Calculate item total based on selected choices
    let itemPrice = item.price;
    (item.options || []).forEach((opt) => {
      const choices = selectedChoices[opt.name] || [];
      choices.forEach((cName) => {
        const found = opt.choices.find((c) => c.name === cName);
        if (found) itemPrice += found.priceDelta;
      });
    });

    const cartItemId = `${item.id}-${JSON.stringify(selectedChoices)}-${specialInstructions}`;
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((ci) => ci.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        const newCartItem: CartItem = {
          id: cartItemId,
          item,
          restaurantId: parentRestaurant.id,
          restaurantName: parentRestaurant.name,
          quantity: 1,
          selectedChoices,
          specialInstructions,
          itemTotal: itemPrice,
        };
        return [...prevCart, newCartItem];
      }
    });

    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.itemTotal * item.quantity,
    0
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartRestaurant = cart.length > 0
    ? restaurants.find((r) => r.id === cart[0].restaurantId)
    : undefined;

  const handleOrderSuccess = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCurrentView('orders');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
        <h2 className="text-base font-bold text-stone-900">Loading Cravery Food Platform...</h2>
        <p className="text-xs text-stone-500 mt-1">Connecting to MongoDB database and Express server</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header Contract */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === 'customer') {
            setActiveDetailRestaurant(null);
          }
        }}
        cartItemCount={cartItemCount}
        cartSubtotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main App Content Views */}
      <main className="flex-1 pb-16">
        {currentView === 'customer' && !activeDetailRestaurant && (
          <CustomerExploreView
            restaurants={restaurants}
            onSelectRestaurant={(restaurant) => {
              setActiveDetailRestaurant(restaurant);
            }}
            onOpenAdmin={() => {
              setCurrentView('admin');
            }}
          />
        )}

        {currentView === 'customer' && activeDetailRestaurant && (
          <RestaurantDetailView
            restaurant={activeDetailRestaurant}
            onBack={() => setActiveDetailRestaurant(null)}
            onAddToCart={handleAddToCart}
            onOpenAdmin={(restaurantId) => {
              setSelectedAdminRestaurantId(restaurantId);
              setCurrentView('admin');
            }}
          />
        )}

        {currentView === 'admin' && (
          <RestaurantMenuAdmin
            restaurants={restaurants}
            selectedRestaurantId={selectedAdminRestaurantId || restaurants[0]?.id || ''}
            onSelectRestaurant={(id) => setSelectedAdminRestaurantId(id)}
            onRefreshData={refreshData}
            onViewCustomerMenu={(restaurantId) => {
              const target = restaurants.find((r) => r.id === restaurantId);
              if (target) {
                setActiveDetailRestaurant(target);
                setCurrentView('customer');
              }
            }}
            orders={orders}
          />
        )}

        {currentView === 'orders' && (
          <OrdersView
            orders={orders}
            onRefreshOrders={refreshData}
            onBrowseRestaurants={() => {
              setActiveDetailRestaurant(null);
              setCurrentView('customer');
            }}
          />
        )}

        {currentView === 'mongo_logs' && (
          <MongoLoginLogsView
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        restaurant={cartRestaurant}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={() => setCart([])}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* User Auth Modal (MongoDB Login & Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">Cravery</span>
            <span>· Gourmet Food Delivery & Restaurant Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <span>MongoDB Database Engine</span>
            <span aria-hidden="true">·</span>
            <span>User Authentication & Login Audit Trail</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
