export type DietaryTag = 'vegetarian' | 'vegan' | 'gluten_free' | 'halal' | 'dairy_free' | 'spicy';

export interface MenuItemChoice {
  id: string;
  name: string;
  priceDelta: number;
}

export interface MenuItemOption {
  id: string;
  name: string;
  required: boolean;
  maxSelect: number;
  choices: MenuItemChoice[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  dietaryTags: DietaryTag[];
  options?: MenuItemOption[];
  salesCount?: number;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  description: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  deliveryTimeMinutes: number;
  deliveryFee: number;
  minimumOrder: number;
  address: string;
  phone: string;
  imageUrl: string;
  bannerUrl: string;
  isOpen: boolean;
  isFeatured: boolean;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  categories: MenuCategory[];
  items: MenuItem[];
  createdAt: string;
}

export interface CartItem {
  id: string; // unique cart item id (e.g. itemId + timestamp)
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
  quantity: number;
  selectedChoices: { [optionName: string]: string[] };
  specialInstructions?: string;
  itemTotal: number;
}

export type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';

export interface OrderItemSummary {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  optionsSummary?: string;
  itemTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItemSummary[];
  subtotal: number;
  deliveryFee: number;
  tip: number;
  discount: number;
  promoCode?: string;
  total: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  paymentMethod: 'card' | 'apple_pay' | 'cash_on_delivery';
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryMinutes: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'admin' | 'restaurant_owner';
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginLog {
  id: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  role?: string;
  loginTimestamp: string;
  ipAddress: string;
  userAgent: string;
  deviceType: string;
  status: 'success' | 'failed';
  failureReason?: string;
  sessionToken?: string;
}

export interface DatabaseStatusInfo {
  type: 'mongodb_atlas' | 'mongodb_embedded';
  status: 'connected' | 'fallback_active';
  databaseName: string;
  collections: {
    name: string;
    count: number;
  }[];
  totalLoginLogs: number;
  totalUsers: number;
  mongoUriConfigured: boolean;
}

export interface DashboardStats {

  totalRestaurants: number;
  totalMenuItems: number;
  activeItemsCount: number;
  soldOutItemsCount: number;
  totalOrders: number;
  totalRevenue: number;
  activeOrdersCount: number;
}
