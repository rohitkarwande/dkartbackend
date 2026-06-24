import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ChatRoom {
  id: number;
  inquiry_id: number;
  equipment_post_id: number;
  buyer_id: number;
  seller_id: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Fetch all chat rooms for the logged-in user
export function useChatRooms() {
  return useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: async () => {
      const res = await api.get('/chat/rooms');
      return res.data as ChatRoom[];
    },
  });
}

// Fetch messages for a specific room (polls every 3 seconds)
export function useChatMessages(roomId: number | null) {
  return useQuery({
    queryKey: ['chat', 'messages', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const res = await api.get(`/chat/rooms/${roomId}/messages`);
      return res.data as ChatMessage[];
    },
    enabled: !!roomId,
    refetchInterval: 3000, // Poll for new messages
  });
}

// Create a new chat room (typically called after inquiry is created or accepted)
export function useCreateChatRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inquiry_id }: { inquiry_id: number }) => {
      const res = await api.post('/chat/rooms', { inquiry_id });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
    },
  });
}

// Send a message in a room
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, message }: { roomId: number; message: string }) => {
      const res = await api.post(`/chat/rooms/${roomId}/messages`, { message });
      return res.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific room's messages so they refresh immediately
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', variables.roomId] });
    },
  });
}
