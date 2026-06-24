import { useState, useEffect, useRef } from "react";
import { useChatRooms, useChatMessages, useSendMessage } from "@/hooks/useChat";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Chat() {
  const { data: rooms, isLoading: isLoadingRooms } = useChatRooms();
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const { data: messages, isLoading: isLoadingMessages } = useChatMessages(activeRoomId);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatically select the first room if none is selected
  useEffect(() => {
    if (rooms && rooms.length > 0 && !activeRoomId) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, activeRoomId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    try {
      await sendMessage.mutateAsync({ roomId: activeRoomId, message: newMessage });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Rooms Sidebar */}
      <div className="w-1/3 border-r bg-slate-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h2 className="font-semibold text-lg text-slate-900">Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          {isLoadingRooms ? (
            <div className="flex p-8 justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : rooms?.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No active conversations.</div>
          ) : (
            <div className="flex flex-col">
              {rooms?.map((room: any) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomId(room.id)}
                  className={`flex items-start gap-3 p-4 text-left transition-colors border-b last:border-0 ${
                    activeRoomId === room.id ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-slate-100 border-l-4 border-l-transparent"
                  }`}
                >
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="bg-slate-200 text-slate-600">
                      U{room.buyer_id}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-medium text-sm text-slate-900 truncate">
                        Inquiry #{room.inquiry_id}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(room.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      Equipment ID: {room.equipment_post_id}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeRoomId ? (
          <>
            <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm z-10">
              <div>
                <h3 className="font-semibold text-slate-900">Chat Room #{activeRoomId}</h3>
                <p className="text-xs text-slate-500">Connected</p>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4 bg-slate-50">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages?.map((msg: any) => {
                    // Quick hack for demo to determine 'self' vs 'other'. 
                    // In real app, compare with logged in user ID from Context/Redux.
                    // For now, let's assume sender_id isn't 0. 
                    const isSelf = false; // Replace with user.id === msg.sender_id
                    
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[70%] ${isSelf ? "ml-auto items-end" : "mr-auto items-start"}`}>
                        <div className={`p-3 rounded-2xl ${isSelf ? "bg-primary text-white rounded-br-sm" : "bg-white border rounded-bl-sm text-slate-900 shadow-sm"}`}>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSend} className="flex gap-2 items-center">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-full h-12 px-6 bg-slate-50 border-slate-200 focus-visible:ring-primary focus-visible:ring-offset-0"
                />
                <Button 
                  type="submit" 
                  disabled={sendMessage.isPending || !newMessage.trim()} 
                  className="h-12 w-12 rounded-full p-0 flex items-center justify-center bg-primary hover:bg-primary/90 shadow-md"
                >
                  <Send className="h-5 w-5 ml-1" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
