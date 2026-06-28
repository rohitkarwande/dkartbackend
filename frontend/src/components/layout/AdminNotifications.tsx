import { useEffect, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/api/admin/notifications");
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n: Notification) => !n.is_read).length);
      } catch (error) {
        console.error("Error fetching notifications", error);
      }
    };
    fetchNotifications();

    // Listen for real-time notifications
    const handleNewNotification = (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const socket = getSocket();
    socket.on("admin_notification", handleNewNotification);

    return () => {
      socket.off("admin_notification", handleNewNotification);
    };
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/api/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 mr-2">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="font-normal p-3 flex justify-between items-center border-b">
          <span className="font-semibold text-slate-900">Notifications</span>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount} unread</Badge>}
        </DropdownMenuLabel>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No new notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className={`flex flex-col items-start p-3 cursor-default focus:bg-slate-50 border-b last:border-0 ${
                  !notif.is_read ? "bg-emerald-50/30" : ""
                }`}
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex justify-between w-full items-start gap-2">
                  <span className={`text-sm ${!notif.is_read ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                    {notif.message}
                  </span>
                  {!notif.is_read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                      onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <span className="text-xs text-slate-400 mt-1">
                  {new Date(notif.created_at).toLocaleString()}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
