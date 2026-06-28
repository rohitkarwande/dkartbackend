import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth, useLogout } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  LogOut,
  Loader2,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminKyc";
import { AdminNotifications } from "@/components/layout/AdminNotifications";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "KYC Applications", href: "/admin/kyc", icon: ShieldCheck, badge: "pendingKyc" },
  { label: "Deal Funnel", href: "/admin/deals", icon: TrendingUp },
];

export function AdminLayout() {
  const { data: user, isLoading } = useAuth();
  const { data: stats } = useAdminStats();
  const location = useLocation();
  const logout = useLogout();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col sticky top-0 h-screen">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-violet-600 p-2 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">DKart Admin</p>
                <p className="text-xs text-slate-500">Control Panel</p>
              </div>
            </Link>
          </div>

          {/* Admin Info */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-violet-900 flex items-center justify-center text-violet-300 font-bold text-sm">
                {(user?.first_name?.[0] || user?.email?.[0] || "A").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.first_name || "Admin"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email || user?.phone}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest px-3 mb-3 mt-2">
              Management
            </p>
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
              const badgeCount =
                item.badge && stats ? (stats as Record<string, number>)[item.badge] : 0;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? "bg-violet-600/20 text-violet-300 border border-violet-600/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    {item.label}
                  </div>
                  <div className="flex items-center gap-2">
                    {badgeCount > 0 && (
                      <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {badgeCount}
                      </span>
                    )}
                    <ChevronRight className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "opacity-100 text-violet-400" : ""}`} />
                  </div>
                </Link>
              );
            })}

            <div className="pt-4 border-t border-slate-800 mt-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest px-3 mb-3">
                Quick Access
              </p>
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                <BarChart3 className="h-4 w-4 text-slate-500" />
                User Dashboard
              </Link>
            </div>
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-slate-800">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main Content ────────────────────────────────────────────────── */}
        <main className="flex-1 min-h-screen overflow-auto flex flex-col">
          <div className="p-8 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
