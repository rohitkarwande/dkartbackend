import { Link, useNavigate } from "react-router-dom";
import { Search, PlusCircle, LayoutDashboard, MessageSquare, Package, LogOut, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, useLogout } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { AdminNotifications } from "./AdminNotifications";

import { UserLocation } from "./UserLocation";

export function TopNavbar() {
  const { data: user, isLoading } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const q = formData.get("q");
    if (q) navigate(`/search?keyword=${encodeURIComponent(q as string)}`);
  };

  const isSeller = user?.role === 'seller' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const initials = user?.first_name 
    ? user.first_name.charAt(0).toUpperCase() 
    : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 md:gap-6">
          
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <span className="text-white font-bold text-lg leading-none block">DK</span>
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block text-slate-900">
                D<span className="text-emerald-600">Kart</span>
              </span>
            </Link>

            {/* User Location */}
            {user && <UserLocation />}
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                type="search"
                placeholder="Search MRI machines, X-Ray, ultrasound, ECG..."
                className="w-full pl-10 bg-slate-100 border-transparent focus-visible:bg-white focus-visible:border-slate-300 focus-visible:ring-emerald-500 h-10 transition-all"
              />
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sell Equipment CTA */}
            <Button 
              onClick={() => navigate(isSeller ? '/sell' : user ? '/kyc' : '/signup')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm hidden sm:flex mr-2"
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Sell Equipment
            </Button>

            {/* Auth Controls */}
            {isLoading ? (
              <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border-2 border-emerald-100">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">
                          {user.first_name || 'My Account'}
                        </p>
                        <Badge variant="outline" className={`text-xs capitalize ${isSeller ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-500'}`}>
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email || user.phone}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer py-2">
                    <Link to="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-slate-400" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild className="cursor-pointer py-2 text-violet-600 focus:text-violet-700 focus:bg-violet-50">
                      <Link to="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isSeller && (
                    <DropdownMenuItem asChild className="cursor-pointer py-2">
                      <Link to="/dashboard/listings">
                        <Package className="mr-2 h-4 w-4 text-slate-400" />
                        <span>My Listings</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer py-2">
                    <Link to="/dashboard/inquiries">
                      <MessageSquare className="mr-2 h-4 w-4 text-slate-400" />
                      <span>Inquiries & Chat</span>
                    </Link>
                  </DropdownMenuItem>
                  {!isSeller && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer py-2 text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                        <Link to="/kyc">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          <span>Become a Seller</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer py-2 text-red-600 focus:text-red-700 focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild size="sm" className="hidden sm:flex text-slate-700 hover:text-emerald-600 hover:bg-emerald-50">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link to="/signup">Sign Up Free</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
