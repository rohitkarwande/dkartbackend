import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KycApplication {
  kyc_id: number;
  user_id: number;
  document_type: string;
  document_url: string | null;
  document_file_url: string | null;
  kyc_status: 'Pending' | 'Approved' | 'Rejected';
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  email: string | null;
  phone: string | null;
  role: string;
  user_status: string;
  user_created_at: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalListings: number;
  activeInquiries: number;
  pendingKyc: number;
  approvedKyc: number;
  professions?: Record<string, number>;
}

export interface AdminUser {
  id: number;
  email: string | null;
  phone: string | null;
  is_verified: boolean;
  role: string;
  status: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  kyc_status: string | null;
  document_type: string | null;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data as AdminDashboardStats;
    },
    staleTime: 1000 * 30,
  });
}

export function useKycApplications(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['admin', 'kyc', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const res = await api.get(`/admin/kyc?${params.toString()}`);
      return res.data as KycApplication[];
    },
    staleTime: 1000 * 15,
  });
}

export function useKycDetails(userId: number | null) {
  return useQuery({
    queryKey: ['admin', 'kyc', 'detail', userId],
    queryFn: async () => {
      const res = await api.get(`/admin/kyc/${userId}`);
      return res.data as KycApplication;
    },
    enabled: !!userId,
    staleTime: 1000 * 10,
  });
}

export function useApproveKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.post(`/admin/kyc/${userId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useRejectKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      const res = await api.post(`/admin/kyc/${userId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useAdminUsers(filters?: { search?: string; role?: string; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.role) params.set('role', filters.role);
      if (filters?.status) params.set('status', filters.status);
      const res = await api.get(`/admin/users?${params.toString()}`);
      return res.data as AdminUser[];
    },
    staleTime: 1000 * 30,
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.patch(`/admin/users/${userId}/suspend`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.patch(`/admin/users/${userId}/reactivate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// ─── Security Hooks ──────────────────────────────────────────────────────────

export interface LoginHistoryRecord {
  id: number;
  user_id: number;
  ip_address: string;
  user_agent: string;
  created_at: string;
  email: string | null;
  phone: string | null;
  role: string;
}

export interface IpBlacklistRecord {
  id: number;
  ip_address: string;
  reason: string;
  created_at: string;
}

export function useLoginHistory(search?: string) {
  return useQuery({
    queryKey: ['admin', 'security', 'login-history', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await api.get(`/admin/login-history?${params.toString()}`);
      return res.data as LoginHistoryRecord[];
    },
    staleTime: 1000 * 30,
  });
}

export function useIpBlacklist() {
  return useQuery({
    queryKey: ['admin', 'security', 'ip-blacklist'],
    queryFn: async () => {
      const res = await api.get('/admin/ip-blacklist');
      return res.data as IpBlacklistRecord[];
    },
    staleTime: 1000 * 30,
  });
}

export function useAddIpToBlacklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ip_address: string; reason: string }) => {
      const res = await api.post('/admin/ip-blacklist', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'ip-blacklist'] });
    },
  });
}

export function useRemoveIpFromBlacklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ip: string) => {
      const res = await api.delete(`/admin/ip-blacklist/${encodeURIComponent(ip)}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'ip-blacklist'] });
    },
  });
}
