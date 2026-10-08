import {
  Restaurant,
  MenuCategory,
  MenuItem,
  Order,
  DashboardStats,
  OrderStatus,
  User,
  LoginLog,
  DatabaseStatusInfo,
} from './types';

export const api = {
  // MongoDB User Authentication & Login Tracking
  async login(credentials: { email: string; password: string }): Promise<{ user: User; sessionToken: string; message: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(data: { name: string; email: string; password: string; phone?: string; role?: string }): Promise<{ user: User; sessionToken: string; message: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async getLoginLogs(params?: { email?: string; status?: string; limit?: number }): Promise<LoginLog[]> {
    const searchParams = new URLSearchParams();
    if (params?.email) searchParams.set('email', params.email);
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const res = await fetch(`/api/auth/login-logs?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch login logs');
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/auth/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getDatabaseStatus(): Promise<DatabaseStatusInfo> {
    const res = await fetch('/api/database/status');
    if (!res.ok) throw new Error('Failed to fetch database status');
    return res.json();
  },

  async getRestaurants(params?: { cuisine?: string; search?: string; openOnly?: boolean }): Promise<Restaurant[]> {
    const searchParams = new URLSearchParams();
    if (params?.cuisine && params.cuisine !== 'all') searchParams.set('cuisine', params.cuisine);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.openOnly) searchParams.set('openOnly', 'true');

    const res = await fetch(`/api/restaurants?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    return res.json();
  },

  async getRestaurantById(id: string): Promise<Restaurant> {
    const res = await fetch(`/api/restaurants/${id}`);
    if (!res.ok) throw new Error('Failed to fetch restaurant');
    return res.json();
  },

  async createRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
    const res = await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create restaurant');
    }
    return res.json();
  },

  async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<Restaurant> {
    const res = await fetch(`/api/restaurants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update restaurant');
    return res.json();
  },

  async toggleRestaurantStatus(id: string): Promise<{ id: string; isOpen: boolean }> {
    const res = await fetch(`/api/restaurants/${id}/toggle-status`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to toggle restaurant status');
    return res.json();
  },

  async deleteRestaurant(id: string): Promise<{ success: boolean; removedId: string }> {
    const res = await fetch(`/api/restaurants/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete restaurant');
    return res.json();
  },

  // Category management
  async createCategory(restaurantId: string, data: { name: string; description?: string }): Promise<MenuCategory> {
    const res = await fetch(`/api/restaurants/${restaurantId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create category');
    }
    return res.json();
  },

  async updateCategory(restaurantId: string, categoryId: string, data: { name: string; description?: string }): Promise<MenuCategory> {
    const res = await fetch(`/api/restaurants/${restaurantId}/categories/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  async deleteCategory(restaurantId: string, categoryId: string): Promise<{ success: boolean; deletedCatId: string }> {
    const res = await fetch(`/api/restaurants/${restaurantId}/categories/${categoryId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json();
  },

  // Menu item management
  async createMenuItem(restaurantId: string, itemData: Partial<MenuItem>): Promise<MenuItem> {
    const res = await fetch(`/api/restaurants/${restaurantId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create menu item');
    }
    return res.json();
  },

  async updateMenuItem(restaurantId: string, itemId: string, itemData: Partial<MenuItem>): Promise<MenuItem> {
    const res = await fetch(`/api/restaurants/${restaurantId}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update menu item');
    }
    return res.json();
  },

  async toggleItemAvailability(restaurantId: string, itemId: string, isAvailable?: boolean): Promise<{ id: string; name: string; isAvailable: boolean; message: string }> {
    const res = await fetch(`/api/restaurants/${restaurantId}/items/${itemId}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isAvailable !== undefined ? { isAvailable } : {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to toggle item availability');
    }
    return res.json();
  },

  async deleteMenuItem(restaurantId: string, itemId: string): Promise<{ success: boolean; deletedItemId: string }> {
    const res = await fetch(`/api/restaurants/${restaurantId}/items/${itemId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete menu item');
    return res.json();
  },

  // Orders
  async getOrders(restaurantId?: string): Promise<Order[]> {
    const url = restaurantId ? `/api/orders?restaurantId=${restaurantId}` : '/api/orders';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
  },

  async createOrder(orderPayload: any): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to place order');
    }
    return res.json();
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  },

  // Dashboard Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },
};
