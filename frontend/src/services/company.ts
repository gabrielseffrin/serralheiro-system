import api from './api';
import type { Company } from '@/types';

export const companyApi = {
  get: async (): Promise<{ data: Company }> => {
    const { data } = await api.get<{ data: Company }>('/company');
    return data;
  },

  update: async (payload: Partial<Company>): Promise<{ data: Company }> => {
    const { data } = await api.put<{ data: Company }>('/company', payload);
    return data;
  },

  uploadLogo: async (file: File): Promise<{ data: Company }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await api.post<{ data: Company }>('/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  removeLogo: async (): Promise<{ data: Company }> => {
    const { data } = await api.delete<{ data: Company }>('/company/logo');
    return data;
  },
};
