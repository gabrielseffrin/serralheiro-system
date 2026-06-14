import api from '@/services/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    company_id: string;
    company?: {
      id: string;
      name: string;
    };
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  company_id: string;
  company?: {
    id: string;
    name: string;
  };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  me: async (): Promise<{ data: User }> => {
    const { data } = await api.get<{ data: User }>('/auth/me');
    return data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },
};
