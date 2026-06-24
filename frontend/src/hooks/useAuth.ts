import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export interface UserProfile {
  id: number;
  phone: string;
  email: string | null;
  role: 'buyer' | 'seller' | 'admin';
  created_at: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
}

export function useAuth() {
  const token = localStorage.getItem('token');
  
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const res = await api.get('/user/profile');
      return res.data as UserProfile;
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.clear();
    navigate('/');
  };
}

export function useSubmitKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { document_type: string; document_url: string }) => {
      // Step 1: Submit KYC record
      await api.post('/user/kyc', payload);
      // Step 2: Upgrade role to seller
      const res = await api.post('/user/become-seller');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });
}
