import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3002/api'
  : '/api';

export interface Order {
  id?: number;
  token: string;
  items: any[];
  total: number;
  screenshot?: string;
  timestamp: number;
  status: 'processing' | 'completed';
  phone: string;
}

// React Query hooks
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useOrderByToken(token: string) {
  return useQuery({
    queryKey: ['order', token],
    queryFn: () => getOrderByToken(token),
    enabled: !!token,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, status }: { token: string; status: 'processing' | 'completed' }) =>
      updateOrderStatus(token, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useClearAllOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearAllOrders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export async function getOrders(): Promise<Order[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${token}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch order');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export async function saveOrder(order: Omit<Order, 'id'>): Promise<Order | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: JSON.stringify(order.items),
        total: order.total,
        phone: order.phone,
        screenshot: order.screenshot
      }),
    });

    if (!response.ok) throw new Error('Failed to save order');
    return await response.json();
  } catch (error) {
    console.error('Error saving order:', error);
    return null;
  }
}

export async function updateOrderStatus(token: string, status: 'processing' | 'completed'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${token}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
}

export async function deleteOrder(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${token}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting order:', error);
    return false;
  }
}

export async function clearAllOrders(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Error clearing orders:', error);
    return false;
  }
}