import { ShoppingBag, Store, Compass, ReceiptText, Database, User as UserIcon, LogOut } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentView: 'customer' | 'admin' | 'orders' | 'mongo_logs';
  onNavigate: (view: 'customer' | 'admin' | 'orders' | 'mongo_logs') => void;
  cartItemCount: number;
  cartSubtotal: number;
  onOpenCart: () => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

export function Header({
  currentView,
  onNavigate,
  cartItemCount,
  cartSubtotal,
  onOpenCart,
  currentUser,
  onOpenAuthModal,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('customer')}
            className="text-xl font-bold tracking-tight text-stone-900 hover:text-stone-700 transition-colors flex items-center gap-2 cursor-pointer text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              C
            </span>
            <span>Cravery</span>
          </button>
        </div>

        {/* Zone 2: Clean Text Nav Links */}
        <nav className="flex items-center gap-5 sm:gap-7 text-sm font-medium">
          <button
            onClick={() => onNavigate('customer')}
            className={`transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'customer'
                ? 'text-amber-700 font-semibold border-b-2 border-amber-600'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Restaurants</span>
          </button>

          <button
            onClick={() => onNavigate('admin')}
            className={`transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'admin'
                ? 'text-amber-700 font-semibold border-b-2 border-amber-600'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Menu Manager</span>
          </button>

          <button
            onClick={() => onNavigate('orders')}
            className={`transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'orders'
                ? 'text-amber-700 font-semibold border-b-2 border-amber-600'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>Orders</span>
          </button>

          <button
            onClick={() => onNavigate('mongo_logs')}
            className={`transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'mongo_logs'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="MongoDB Database and User Login History"
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>MongoDB & Logins</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions (User profile & Bag) */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/90 rounded-lg p-1">
              <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-stone-900 truncate max-w-[120px]">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider hidden sm:inline">
                  ({currentUser.role.replace('_', ' ')})
                </span>
              </div>
              <button
                onClick={onSignOut}
                className="p-1 text-stone-400 hover:text-rose-600 hover:bg-stone-200/60 rounded transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-stone-700" />
            <span className="hidden sm:inline">Bag</span>
            {cartItemCount > 0 ? (
              <span className="tabular-nums font-bold text-amber-700 ml-0.5">
                ${cartSubtotal.toFixed(2)} ({cartItemCount})
              </span>
            ) : (
              <span className="text-stone-500 font-normal hidden sm:inline">(0)</span>
            )}
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-600 text-white rounded-full text-xs font-bold flex items-center justify-center sm:hidden">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
