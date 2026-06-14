import api from './api';
import type { Product, ProductLine, ProductColor, GlassType, PaginatedResponse } from '@/types';

export const productsApi = {
  // Products CRUD
  listProducts: async (page = 1): Promise<PaginatedResponse<Product>> => {
    const { data } = await api.get<PaginatedResponse<Product>>(`/products?page=${page}`);
    return data;
  },

  getProduct: async (id: string): Promise<{ data: Product }> => {
    const { data } = await api.get<{ data: Product }>(`/products/${id}`);
    return data;
  },

  createProduct: async (payload: Partial<Product>): Promise<{ data: Product }> => {
    const { data } = await api.post<{ data: Product }>('/products', payload);
    return data;
  },

  updateProduct: async (id: string, payload: Partial<Product>): Promise<{ data: Product }> => {
    const { data } = await api.put<{ data: Product }>(`/products/${id}`, payload);
    return data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  // Lines CRUD
  listLines: async (): Promise<{ data: ProductLine[] }> => {
    const { data } = await api.get<{ data: ProductLine[] }>('/product-lines');
    return data;
  },

  createLine: async (payload: Partial<ProductLine>): Promise<{ data: ProductLine }> => {
    const { data } = await api.post<{ data: ProductLine }>('/product-lines', payload);
    return data;
  },

  updateLine: async (id: string, payload: Partial<ProductLine>): Promise<{ data: ProductLine }> => {
    const { data } = await api.put<{ data: ProductLine }>(`/product-lines/${id}`, payload);
    return data;
  },

  deleteLine: async (id: string): Promise<void> => {
    await api.delete(`/product-lines/${id}`);
  },

  // Colors CRUD
  listColors: async (type?: 'profile' | 'accessory'): Promise<{ data: ProductColor[] }> => {
    const url = type ? `/product-colors?type=${type}` : '/product-colors';
    const { data } = await api.get<{ data: ProductColor[] }>(url);
    return data;
  },

  createColor: async (payload: Partial<ProductColor>): Promise<{ data: ProductColor }> => {
    const { data } = await api.post<{ data: ProductColor }>('/product-colors', payload);
    return data;
  },

  updateColor: async (id: string, payload: Partial<ProductColor>): Promise<{ data: ProductColor }> => {
    const { data } = await api.put<{ data: ProductColor }>(`/product-colors/${id}`, payload);
    return data;
  },

  deleteColor: async (id: string): Promise<void> => {
    await api.delete(`/product-colors/${id}`);
  },

  // Glass Types CRUD
  listGlassTypes: async (): Promise<{ data: GlassType[] }> => {
    const { data } = await api.get<{ data: GlassType[] }>('/glass-types');
    return data;
  },

  createGlassType: async (payload: Partial<GlassType>): Promise<{ data: GlassType }> => {
    const { data } = await api.post<{ data: GlassType }>('/glass-types', payload);
    return data;
  },

  updateGlassType: async (id: string, payload: Partial<GlassType>): Promise<{ data: GlassType }> => {
    const { data } = await api.put<{ data: GlassType }>(`/glass-types/${id}`, payload);
    return data;
  },

  deleteGlassType: async (id: string): Promise<void> => {
    await api.delete(`/glass-types/${id}`);
  },
};
