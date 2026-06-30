import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, MessageSquare, MessageCircle, ShoppingBag, Loader2, User, Activity, Shield } from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Listings", href: "/dashboard/listings", icon: Package, sellerOnly: true },
  { label: "Inquiries", href: "/dashboard/inquiries", icon: Activity },
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

  const visibleItems = NAV_ITEMS.filter(item => !item.sellerOnly || isSeller);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-20 md:pb-8">
      <div className="flex gap-8 relative">
        
        {/* Left sidebar navigation — desktop only */}
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/40 overflow-hidden sticky top-8">
            {/* User info */}
            <div className="p-6 border-b bg-gradient-to-br from-slate-50 to-white">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg mb-3">
                {(user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <p className="font-bold text-base text-slate-900 truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'My Account'}
              </p>
              <p className="text-sm text-slate-500 truncate mt-0.5">{user?.email || user?.phone}</p>
              <span className={`inline-block mt-3 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                isSeller ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {user?.role}
              </span>
            </div>
            
            {/* Nav links */}
            <nav className="p-3 space-y-1">
              {visibleItems.map((item) => {
                const isActive = item.exact 
                  ? location.pathname === item.href 
                  : location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Marketplace quick links */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Marketplace</p>
                <Link to="/search" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  <ShoppingBag className="h-5 w-5 text-slate-400" />
                  Browse Equipment
                </Link>
              </div>

              {/* Admin quick link */}
              {user?.role === 'admin' && (
                <div className="mt-2 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Administration</p>
                  <Link to="/admin" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors">
                    <Shield className="h-5 w-5 text-violet-500" />
                    Admin Panel
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ─────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex items-center justify-around px-2 py-1">
          {visibleItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.href 
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                  isActive ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


