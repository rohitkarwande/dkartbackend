import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// These match backend enums exactly
export const EQUIPMENT_CATEGORIES = [
  'MRI', 'X-Ray', 'Cathlab', 'ECG', 'Ultrasound',
  'Ventilator', 'CT Scan', 'Patient Monitor',
  'Defibrillator', 'Laboratory Equipment', 'Surgical Equipment', 'Other'
] as const;

export const EQUIPMENT_CONDITIONS = ['Used', 'Refurbished', 'Spare'] as const;
export const EQUIPMENT_STATUSES = ['Draft', 'Active', 'Sold', 'Archived'] as const;

export interface Equipment {
  id: string | number;
  title: string;         // backend uses 'title' not 'name'
  category: string;
  brand: string;
  model: string;
  manufacturing_year: number;
  condition: string;
  description: string;
  price: number;
  city: string;          // backend uses 'city' not 'location'
  state: string;
  country: string;
  images: Array<{ id: number; image_url: string }>;
  status: 'Draft' | 'Active' | 'Sold' | 'Archived';
  seller_id: number;
  seller_email?: string;
  created_at: string;
}

export interface EquipmentFilters {
  search?: string;       // backend uses 'search' not 'keyword'
  category?: string;
  condition?: string;
  city?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

// Fetch all equipment (public marketplace)
export function useEquipment(filters?: EquipmentFilters) {
  // Remap 'keyword' to 'search' for the backend
  const backendFilters = filters ? {
    ...filters,
    search: (filters as any).keyword || filters.search,
    keyword: undefined,
  } : undefined;

  return useQuery({
    queryKey: ['equipment', filters],
    queryFn: async () => {
      const res = await api.get('/equipment', { params: backendFilters });
      return res.data.data as Equipment[];
    },
  });
}

// Fetch single equipment details — backend returns { post, images }
export function useSingleEquipment(id: string) {
  return useQuery({
    queryKey: ['equipment', 'single', id],
    queryFn: async () => {
      const res = await api.get(`/equipment/${id}`);
      // Backend returns { post: {...}, images: [...] }
      // Merge them for easy consumption
      const { post, images } = res.data;
      return { ...post, images } as Equipment;
    },
    enabled: !!id,
  });
}

// Fetch similar listings
export function useSimilarEquipment(id: string) {
  return useQuery({
    queryKey: ['equipment', 'similar', id],
    queryFn: async () => {
      const res = await api.get(`/equipment/${id}/similar`);
      return res.data as Equipment[];
    },
    enabled: !!id,
  });
}

// Fetch seller's own listings (dashboard)
export function useMyListings() {
  return useQuery({
    queryKey: ['my-equipment'],
    queryFn: async () => {
      const res = await api.get('/equipment/my-posts');
      return res.data.data as Equipment[];
    },
  });
}

// Create new equipment listing
export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/equipment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
}

// Delete (archive) equipment
export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const res = await api.delete(`/equipment/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-equipment'] });
    },
  });
}

// Update equipment status
export function useUpdateEquipmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string | number; status: string }) => {
      const res = await api.patch(`/equipment/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-equipment'] });
    },
  });
}
