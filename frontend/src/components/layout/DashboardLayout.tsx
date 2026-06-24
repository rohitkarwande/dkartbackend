import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, MessageSquare, MessageCircle, ShoppingBag, Loader2 } from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "My Listings", href: "/dashboard/listings", icon: Package, sellerOnly: true },
  { label: "Inquiries", href: "/dashboard/inquiries", icon: MessageSquare },
  { label: "Chat", href: "/dashboard/chat", icon: MessageCircle },
];

export function DashboardLayout() {
  const { data: user, isLoading } = useAuth();
  const location = useLocation();
  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        
        {/* Left sidebar navigation */}
        <aside className="w-56 flex-shrink-0 hidden md:block">
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            {/* User info */}
            <div className="p-4 border-b bg-slate-50">
              <p className="font-semibold text-sm text-slate-900 truncate">
                {user?.first_name || 'My Account'}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || user?.phone}</p>
              <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                isSeller ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {user?.role}
              </span>
            </div>
            
            {/* Nav links */}
            <nav className="p-2">
              {NAV_ITEMS.filter(item => !item.sellerOnly || isSeller).map((item) => {
                const isActive = item.exact 
                  ? location.pathname === item.href 
                  : location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Marketplace quick links */}
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Marketplace</p>
                <Link to="/search" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                  <ShoppingBag className="h-4 w-4 text-slate-400" />
                  Browse Equipment
                </Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
