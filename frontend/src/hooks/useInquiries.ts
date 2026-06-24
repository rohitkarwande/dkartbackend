import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Inquiry {
  id: number;
  equipment_post_id: number;
  buyer_id: number;
  seller_id: number;
  status: 'Pending' | 'Contacted' | 'Closed_Won' | 'Closed_Lost';
  message: string;
  created_at: string;
  // Included from JOINs in backend depending on the endpoint
  buyer_email?: string;
  buyer_phone?: string;
  equipment_name?: string;
}

// Fetch inquiries received by the seller
export function useSellerInquiries() {
  return useQuery({
    queryKey: ['inquiries', 'seller'],
    queryFn: async () => {
      const res = await api.get('/inquiries/seller');
      return res.data as Inquiry[];
    },
  });
}

// Fetch inquiries sent by the buyer
export function useBuyerInquiries() {
  return useQuery({
    queryKey: ['inquiries', 'buyer'],
    queryFn: async () => {
      const res = await api.get('/inquiries/buyer');
      return res.data as Inquiry[];
    },
  });
}

// Create a new inquiry (Buyer contacting Seller)
export function useCreateInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { equipment_post_id: string | number; message: string }) => {
      const res = await api.post('/inquiries', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'buyer'] });
    },
  });
}

// Update inquiry status (Seller managing leads)
export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await api.patch(`/inquiries/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'seller'] });
    },
  });
}
