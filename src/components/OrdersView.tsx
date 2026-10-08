import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Bike,
  ChefHat,
  ShoppingBag,
  MapPin,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { api } from '../api';

interface OrdersViewProps {
  orders: Order[];
  onRefreshOrders: () => Promise<void>;
  onSelectOrder?: (order: Order) => void;
  onBrowseRestaurants: () => void;
}

export function OrdersView({
  orders,
  onRefreshOrders,
  onBrowseRestaurants,
}: OrdersViewProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders[0]?.id || ''
  );

  const selectedOrder =
    orders.find((o) => o.id === selectedOrderId) || orders[0];

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  const stages: { key: OrderStatus; label: string; icon: any; desc: string }[] = [
    {
      key: 'placed',
      label: 'Order Placed',
      icon: ShoppingBag,
      desc: 'Sent to restaurant kitchen',
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      icon: CheckCircle2,
      desc: 'Kitchen accepted ticket',
    },
    {
      key: 'preparing',
      label: 'Preparing',
      icon: ChefHat,
      desc: 'Chef is crafting your dishes',
    },
    {
      key: 'on_the_way',
      label: 'On the Way',
      icon: Bike,
      desc: 'Courier picked up and en route',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      icon: CheckCircle2,
      desc: 'Enjoy your gourmet meal!',
    },
  ];

  const getStageIndex = (status: OrderStatus) => {
    const idx = stages.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const currentStageIndex = selectedOrder ? getStageIndex(selectedOrder.status) : 0;

  const handleSimulateNextStage = async () => {
    if (!selectedOrder) return;
    const nextStatuses: Record<OrderStatus, OrderStatus> = {
      placed: 'confirmed',
      confirmed: 'preparing',
      preparing: 'on_the_way',
      on_the_way: 'delivered',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    const next = nextStatuses[selectedOrder.status];
    if (next === selectedOrder.status) return;

    setIsUpdating(true);
    try {
      await api.updateOrderStatus(selectedOrder.id, next);
      await onRefreshOrders();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Orders & Live Tracking
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Real-time fulfillment pipeline with kitchen ticket status and courier updates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshOrders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Feed</span>
          </button>
          <button
            onClick={onBrowseRestaurants}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
          >
            Order More Food
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-xl p-16 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-900">No orders placed yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Browse our artisanal restaurants, customize your dishes, and place your first order.
          </p>
          <button
            onClick={onBrowseRestaurants}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Explore Menus
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Order List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Recent Orders ({orders.length})
            </h3>
            <div className="space-y-2">
              {orders.map((o) => {
                const isSelected = o.id === selectedOrderId;
                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/40 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-stone-900">{o.orderNumber}</span>
                      <span className="text-stone-500 tabular-nums">
                        ${o.total.toFixed(2)}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-stone-900 truncate">
                      {o.restaurantName}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100 mt-2">
                      <span className="capitalize font-medium text-amber-800">
                        {o.status.replace('_', ' ')}
                      </span>
                      <span>{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Order Detailed Live Tracker */}
          {selectedOrder && (
            <div className="lg:col-span-8 space-y-6">
              {/* Tracker Card */}
              <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                        Live Tracking
                      </span>
                      <span className="text-xs text-stone-400">·</span>
                      <span className="text-xs font-mono font-medium text-stone-500">
                        {selectedOrder.orderNumber}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-stone-900 mt-0.5">
                      {selectedOrder.restaurantName}
                    </h2>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-xs text-stone-500 block">Estimated Arrival</span>
                    <span className="text-lg font-bold text-stone-900 tabular-nums flex items-center gap-1 justify-end">
                      <Clock className="w-4 h-4 text-amber-600" />
                      {selectedOrder.status === 'delivered' ? 'Delivered' : `~${selectedOrder.estimatedDeliveryMinutes} mins`}
                    </span>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="relative">
                  <div className="grid grid-cols-5 gap-2 relative z-10">
                    {stages.map((stg, idx) => {
                      const isComplete = idx <= currentStageIndex;
                      const isCurrent = idx === currentStageIndex;
                      const Icon = stg.icon;
                      return (
                        <div key={stg.key} className="text-center space-y-2">
                          <div
                            className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center transition-colors ${
                              isCurrent
                                ? 'bg-amber-600 text-white ring-4 ring-amber-100 shadow-md'
                                : isComplete
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-100 text-stone-400 border border-stone-200'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <span
                              className={`text-xs block font-bold leading-tight ${
                                isCurrent
                                  ? 'text-amber-800'
                                  : isComplete
                                  ? 'text-stone-900'
                                  : 'text-stone-400'
                              }`}
                            >
                              {stg.label}
                            </span>
                            <span className="text-[10px] text-stone-400 hidden sm:block mt-0.5">
                              {stg.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Courier Map Simulation Card */}
                {selectedOrder.status === 'on_the_way' && (
                  <div className="bg-stone-900 rounded-xl p-5 text-white relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Courier En Route
                        </span>
                      </div>
                      <span className="text-xs text-stone-400">GPS Live Telemetry</span>
                    </div>

                    <div className="h-28 bg-stone-800/80 rounded-lg border border-stone-700/60 relative flex items-center justify-center overflow-hidden">
                      {/* Stylized vector map streets */}
                      <svg
                        className="absolute inset-0 w-full h-full opacity-20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M0,20 Q120,80 240,40 T480,90 T720,30"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                        />
                        <path
                          d="M50,120 L200,0 M300,120 L450,0 M600,120 L750,0"
                          fill="none"
                          stroke="white"
                          strokeWidth="1.5"
                        />
                      </svg>

                      {/* Route Path */}
                      <div className="flex items-center justify-between w-4/5 relative z-10">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                            <ChefHat className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] text-stone-300 mt-1">Kitchen</span>
                        </div>

                        {/* Moving Courier */}
                        <div className="flex-1 px-4 relative">
                          <div className="h-1 bg-stone-700 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-2/3 animate-pulse" />
                          </div>
                          <div className="absolute top-1/2 left-2/3 -translate-y-1/2 -translate-x-1/2 bg-amber-500 text-stone-950 p-1.5 rounded-full shadow-lg">
                            <Bike className="w-4 h-4 animate-bounce" />
                          </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] text-stone-300 mt-1">Your Door</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 text-xs">
                      <span className="text-stone-300">
                        Driver: <strong>Marco D. (Insulated Cargo Bag)</strong>
                      </span>
                      <span className="flex items-center gap-1 text-stone-300">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        Direct Contact
                      </span>
                    </div>
                  </div>
                )}

                {/* Simulation Control (Testing helper) */}
                <div className="pt-2 flex items-center justify-between border-t border-stone-200 text-xs">
                  <span className="text-stone-500">
                    Live Status Simulation:
                  </span>
                  <button
                    onClick={handleSimulateNextStage}
                    disabled={isUpdating || selectedOrder.status === 'delivered'}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-lg font-medium cursor-pointer"
                  >
                    {selectedOrder.status === 'delivered'
                      ? 'Order Complete'
                      : 'Advance Order Stage →'}
                  </button>
                </div>
              </div>

              {/* Order Receipt Details */}
              <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-stone-900">Receipt Summary</h3>

                <div className="divide-y divide-stone-100">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between text-xs">
                      <div>
                        <div className="font-bold text-stone-900">
                          {item.quantity}x {item.name}
                        </div>
                        {item.optionsSummary && (
                          <div className="text-stone-500">{item.optionsSummary}</div>
                        )}
                      </div>
                      <span className="font-semibold text-stone-900 tabular-nums">
                        ${item.itemTotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="tabular-nums">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount ({selectedOrder.promoCode})</span>
                      <span className="tabular-nums">-${selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="tabular-nums">${selectedOrder.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Courier Tip</span>
                    <span className="tabular-nums">${selectedOrder.tip.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total Paid ({selectedOrder.paymentMethod.replace('_', ' ')})</span>
                    <span className="tabular-nums">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg text-xs text-stone-600 space-y-1">
                  <div>
                    <strong>Delivery Address:</strong> {selectedOrder.deliveryAddress}
                  </div>
                  <div>
                    <strong>Recipient:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone})
                  </div>
                  {selectedOrder.deliveryNotes && (
                    <div>
                      <strong>Notes:</strong> {selectedOrder.deliveryNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
