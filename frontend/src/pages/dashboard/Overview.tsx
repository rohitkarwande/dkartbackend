import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { 
  Package, MessageSquare, TrendingUp, PlusCircle, 
  ShieldCheck, Loader2, ArrowRight, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

function useUserDashboard() {
  return useQuery({
    queryKey: ['user', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/user/dashboard');
      return res.data;
    },
    retry: false,
  });
}

export function DashboardOverview() {
  const { data: user, isLoading: isUserLoading } = useAuth();
  const { data: stats, isLoading: isStatsLoading } = useUserDashboard();

  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  if (isUserLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back{user?.first_name ? `, ${user.first_name}` : ''}!
          </h1>
          <p className="text-slate-500 mt-1">
            Your healthcare marketplace command center • 
            <span className="ml-2 font-semibold text-emerald-600 capitalize">{user?.role} Account</span>
          </p>
        </div>
        {isSeller ? (
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
            <Link to="/sell">
              <PlusCircle className="mr-2 h-4 w-4" />
              List Equipment
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
            <Link to="/kyc">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Become a Seller
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Listings</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {isStatsLoading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : (stats?.stats?.totalPosts ?? 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Your equipment posts</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Inquiries</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {isStatsLoading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : (stats?.stats?.totalInquiries ?? 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total leads</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Account Role</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 capitalize">{user?.role}</p>
          <p className="text-xs text-slate-400 mt-1">Platform access level</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Status</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">Active</p>
          <p className="text-xs text-slate-400 mt-1">Account standing</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-slate-900 mb-2">Browse Equipment</h3>
          <p className="text-sm text-slate-500 mb-4">Discover medical equipment from verified sellers nationwide.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/search">Browse Marketplace <ArrowRight className="ml-2 h-3 w-3" /></Link>
          </Button>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-slate-900 mb-2">My Inquiries</h3>
          <p className="text-sm text-slate-500 mb-4">Track leads, manage communications, and close deals.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/inquiries">View Inquiries <ArrowRight className="ml-2 h-3 w-3" /></Link>
          </Button>
        </div>

        {isSeller ? (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-slate-900 mb-2">My Listings</h3>
            <p className="text-sm text-slate-500 mb-4">Manage your equipment inventory and track performance.</p>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Link to="/dashboard/listings">Manage Inventory <ArrowRight className="ml-2 h-3 w-3" /></Link>
            </Button>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed p-6 rounded-xl">
            <h3 className="font-semibold text-slate-900 mb-2">Start Selling</h3>
            <p className="text-sm text-slate-500 mb-4">Upgrade your account to list and sell medical equipment.</p>
            <Button asChild size="sm" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              <Link to="/kyc">Upgrade to Seller <ArrowRight className="ml-2 h-3 w-3" /></Link>
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
