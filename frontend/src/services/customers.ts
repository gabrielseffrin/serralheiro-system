import api from './api';
import type { Customer, PaginatedResponse } from '@/types';

export const customersApi = {
  list: async (page = 1): Promise<PaginatedResponse<Customer>> => {
    const { data } = await api.get<PaginatedResponse<Customer>>(`/customers?page=${page}`);
    return data;
  },

  get: async (id: string): Promise<{ data: Customer }> => {
    const { data } = await api.get<{ data: Customer }>(`/customers/${id}`);
    return data;
  },

  create: async (payload: Partial<Customer>): Promise<{ data: Customer }> => {
    const { data } = await api.post<{ data: Customer }>('/customers', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Customer>): Promise<{ data: Customer }> => {
    const { data } = await api.put<{ data: Customer }>(`/customers/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};
