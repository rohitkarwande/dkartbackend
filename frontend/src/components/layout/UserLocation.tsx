import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function UserLocation() {
  const [location, setLocation] = useState<string>("Select location");
  const [tempLocation, setTempLocation] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      setLocation(savedLocation);
    } else {
      // Auto-detect location based on IP address (no permission prompt needed)
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          if (data.city) {
            setLocation(data.city);
            localStorage.setItem("userLocation", data.city);
          } else {
            // Fallback to browser geolocation if IP detection fails
            tryBrowserGeolocation();
          }
        })
        .catch(() => {
          tryBrowserGeolocation();
        });
    }

    function tryBrowserGeolocation() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
              );
              const data = await res.json();
              const city = data.address.city || data.address.town || data.address.village || data.address.state;
              if (city) {
                setLocation(city);
                localStorage.setItem("userLocation", city);
              }
            } catch (error) {
              console.error("Error reverse geocoding:", error);
            }
          },
          () => {
            // Geolocation blocked or failed
          },
          { timeout: 5000 }
        );
      }
    }
  }, []);

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempLocation.trim()) {
      setLocation(tempLocation.trim());
      localStorage.setItem("userLocation", tempLocation.trim());
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="hidden md:flex items-center gap-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 px-2 ml-4 h-10 shrink-0"
        >
          <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
          <div className="flex flex-col items-start leading-none text-left min-w-0 max-w-[120px]">
            <span className="text-[10px] text-slate-500 font-medium">Deliver to</span>
            <span className="text-sm font-bold text-slate-800 truncate w-full">{location}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose your location</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-500 mb-4">
            Delivery options and delivery speeds may vary for different locations.
          </p>
          <form onSubmit={handleSaveLocation} className="flex gap-2">
            <Input
              value={tempLocation}
              onChange={(e) => setTempLocation(e.target.value)}
              placeholder="Enter Pincode or City"
              className="flex-1"
              autoFocus
            />
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Apply
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
