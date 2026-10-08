import { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { CartItem, Restaurant, Order } from '../types';
import { api } from '../api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  restaurant?: Restaurant;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: Order) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  restaurant,
  onUpdateQuantity,
  onClearCart,
  onOrderSuccess,
}: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountRate: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  const [tipRate, setTipRate] = useState<number>(0.15); // 15% default tip
  const [customerName, setCustomerName] = useState('Alex Mercer');
  const [customerPhone, setCustomerPhone] = useState('+1 (555) 234-5678');
  const [deliveryAddress, setDeliveryAddress] = useState('742 Evergreen Terrace, Apt 4B');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'cash_on_delivery'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal * item.quantity, 0);
  const deliveryFee = restaurant ? restaurant.deliveryFee : 2.99;
  const discount = appliedPromo ? subtotal * appliedPromo.discountRate : 0;
  const tip = (subtotal - discount) * tipRate;
  const total = Math.max(0, subtotal - discount + deliveryFee + tip);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'CRAVE20' || code === 'TASTY20') {
      setAppliedPromo({ code, discountRate: 0.2 });
    } else if (code === 'WELCOME10') {
      setAppliedPromo({ code, discountRate: 0.1 });
    } else {
      setPromoError('Invalid code. Try "CRAVE20" for 20% off.');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    if (cart.length === 0) return;

    if (restaurant.minimumOrder && subtotal < restaurant.minimumOrder) {
      alert(`Minimum order for ${restaurant.name} is $${restaurant.minimumOrder.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        restaurantId: restaurant.id,
        items: cart.map((c) => ({
          itemId: c.item.id,
          name: c.item.name,
          price: c.itemTotal,
          quantity: c.quantity,
          optionsSummary: Object.entries(c.selectedChoices || {})
            .map(([opt, choices]) => `${opt}: ${choices.join(', ')}`)
            .join(' | '),
          itemTotal: c.itemTotal * c.quantity,
        })),
        subtotal,
        deliveryFee,
        tip,
        discount,
        promoCode: appliedPromo?.code,
        total,
        customerName,
        customerPhone,
        deliveryAddress,
        deliveryNotes,
        paymentMethod,
      };

      const placedOrder = await api.createOrder(orderPayload);
      onClearCart();
      onClose();
      onOrderSuccess(placedOrder);
    } catch (err: any) {
      alert(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-stone-900">Your Bag</h2>
              {restaurant && (
                <span className="text-xs text-stone-500 truncate max-w-[150px]">
                  · {restaurant.name}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-stone-500 space-y-2">
                <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-sm font-semibold">Your bag is empty</p>
                <p className="text-xs text-stone-400">
                  Explore dishes from our curated artisanal restaurants.
                </p>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Dishes Selected ({cart.length})
                  </div>

                  <div className="divide-y divide-stone-100 border border-stone-200/80 rounded-xl overflow-hidden">
                    {cart.map((cartItem) => (
                      <div key={cartItem.id} className="p-3 bg-white space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-stone-900">
                              {cartItem.item.name}
                            </h4>
                            {Object.entries(cartItem.selectedChoices || {}).map(([opt, choices]) => (
                              <p key={opt} className="text-xs text-stone-500">
                                {opt}: {choices.join(', ')}
                              </p>
                            ))}
                            {cartItem.specialInstructions && (
                              <p className="text-xs text-amber-700 italic">
                                "{cartItem.specialInstructions}"
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-bold text-stone-900 tabular-nums">
                            ${(cartItem.itemTotal * cartItem.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-stone-400 tabular-nums">
                            ${cartItem.itemTotal.toFixed(2)} each
                          </span>
                          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg p-0.5">
                            <button
                              onClick={() =>
                                onUpdateQuantity(cartItem.id, cartItem.quantity - 1)
                              }
                              className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded cursor-pointer"
                            >
                              {cartItem.quantity === 1 ? (
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <Minus className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span className="text-xs font-bold text-stone-900 px-2 tabular-nums">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() =>
                                onUpdateQuantity(cartItem.id, cartItem.quantity + 1)
                              }
                              className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyPromo} className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. CRAVE20)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedPromo && (
                    <p className="text-xs text-emerald-700 font-semibold">
                      ✓ Promo {appliedPromo.code} applied ({(appliedPromo.discountRate * 100).toFixed(0)}% off)!
                    </p>
                  )}
                  {promoError && <p className="text-xs text-rose-600">{promoError}</p>}
                </form>

                {/* Delivery Information Form */}
                <div className="space-y-3 pt-2 border-t border-stone-200">
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Delivery Details
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-0.5">
                        Address
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-0.5">
                          Name
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-0.5">
                          Phone
                        </label>
                        <input
                          type="text"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-0.5">
                        Courier Instructions
                      </label>
                      <input
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="e.g. Leave at gate, ring apartment bell"
                        className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Tip Selector */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700">Courier Tip</span>
                    <span className="tabular-nums text-stone-500">${tip.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 0.1, 0.15, 0.2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setTipRate(rate)}
                        className={`py-1 text-xs font-medium rounded-md border cursor-pointer ${
                          tipRate === rate
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {rate === 0 ? 'None' : `${rate * 100}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment method selector */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Payment Method
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'card', label: 'Credit Card' },
                      { id: 'apple_pay', label: 'Apple Pay' },
                      { id: 'cash_on_delivery', label: 'Cash on Deliv.' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                          paymentMethod === method.id
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer: Pricing & Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount</span>
                    <span className="tabular-nums">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="tabular-nums">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Courier Tip</span>
                  <span className="tabular-nums">${tip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total</span>
                  <span className="tabular-nums">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Processing Order...' : `Place Order · $${total.toFixed(2)}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
