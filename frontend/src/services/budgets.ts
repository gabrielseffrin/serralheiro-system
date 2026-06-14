import api from './api';
import type { Budget, DashboardStats, PaginatedResponse } from '@/types';

export const budgetsApi = {
  list: async (page = 1): Promise<PaginatedResponse<Budget>> => {
    const { data } = await api.get<PaginatedResponse<Budget>>(`/budgets?page=${page}`);
    return data;
  },

  get: async (id: string): Promise<{ data: Budget }> => {
    const { data } = await api.get<{ data: Budget }>(`/budgets/${id}`);
    return data;
  },

  create: async (payload: Partial<Budget> & { items: any[] }): Promise<{ data: Budget }> => {
    const { data } = await api.post<{ data: Budget }>('/budgets', payload);
    return data;
  },

  update: async (
    id: string,
    payload: Partial<Budget> & { items: any[]; status_change_notes?: string }
  ): Promise<{ data: Budget }> => {
    const { data } = await api.put<{ data: Budget }>(`/budgets/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/budgets/${id}`);
  },

  duplicate: async (id: string): Promise<{ data: Budget }> => {
    const { data } = await api.post<{ data: Budget }>(`/budgets/${id}/duplicate`);
    return data;
  },

  createVersion: async (id: string): Promise<{ data: Budget }> => {
    const { data } = await api.post<{ data: Budget }>(`/budgets/${id}/version`);
    return data;
  },

  changeStatus: async (id: string, status: Budget['status'], notes?: string): Promise<{ data: Budget }> => {
    const { data } = await api.patch<{ data: Budget }>(`/budgets/${id}/status`, { status, notes });
    return data;
  },

  getDashboardStats: async (): Promise<{ data: DashboardStats }> => {
    const { data } = await api.get<{ data: DashboardStats }>('/dashboard/stats');
    return data;
  },

  // Public/Guest Endpoints
  getPublic: async (token: string): Promise<{ data: Budget }> => {
    const { data } = await api.get<{ data: Budget }>(`/public/budgets/${token}`);
    return data;
  },

  approvePublic: async (token: string, notes?: string): Promise<{ data: Budget }> => {
    const { data } = await api.post<{ data: Budget }>(`/public/budgets/${token}/approve`, { notes });
    return data;
  },

  rejectPublic: async (token: string, notes?: string): Promise<{ data: Budget }> => {
    const { data } = await api.post<{ data: Budget }>(`/public/budgets/${token}/reject`, { notes });
    return data;
  },

  // PDF Download (authenticated)
  downloadPdf: async (id: string): Promise<Blob> => {
    const { data } = await api.get(`/budgets/${id}/pdf`, { responseType: 'blob' });
    return data;
  },

  // PDF Download (public guest access)
  downloadPublicPdf: async (token: string): Promise<Blob> => {
    const { data } = await api.get(`/public/budgets/${token}/pdf`, { responseType: 'blob' });
    return data;
  },
};

