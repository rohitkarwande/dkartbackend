import { useAdminStats } from "@/hooks/useAdminKyc";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import {
  Users,
  ShieldCheck,
  Package,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  Download,
  ShieldAlert,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <div
      className={`relative overflow-hidden bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all group hover:bg-slate-800`}
    >
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full ${color} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${color} bg-opacity-20 mb-4`}>
        <Icon className={`h-6 w-6 ${color.replace("bg-", "text-")}`} />
      </div>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      {href && (
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-violet-400 transition-colors mt-3">
          View all <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </div>
  );

  return href ? <Link to={href}>{inner}</Link> : inner;
}

export function AdminOverview() {
  const { data: stats, isLoading, error } = useAdminStats();

  const downloadCSV = async (type: string) => {
    try {
      const response = await api.get(`/admin/reports/csv?type=${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${type}_report.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download CSV", error);
      alert("Failed to download CSV report.");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Overview</h1>
          <p className="text-slate-400 mt-1 text-sm">Real-time marketplace stats and pending actions</p>
        </div>
        {stats?.pendingKyc != null && stats.pendingKyc > 0 && (
          <Link
            to="/admin/kyc"
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-colors w-fit"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{stats.pendingKyc} KYC application{stats.pendingKyc > 1 ? "s" : ""} pending review</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm">Failed to load stats.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Buyers"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            color="bg-blue-500"
            sub="Registered user accounts"
          />
          <StatCard
            label="Active Sellers"
            value={stats?.totalSellers ?? 0}
            icon={TrendingUp}
            color="bg-emerald-500"
            sub="Approved seller accounts"
          />
          <StatCard
            label="Pending KYC"
            value={stats?.pendingKyc ?? 0}
            icon={Clock}
            color="bg-amber-500"
            sub="Awaiting admin review"
            href="/admin/kyc"
          />
          <StatCard
            label="Total Listings"
            value={stats?.totalListings ?? 0}
            icon={Package}
            color="bg-violet-500"
            sub="Equipment posts on platform"
          />
          <StatCard
            label="Active Inquiries"
            value={stats?.activeInquiries ?? 0}
            icon={MessageSquare}
            color="bg-pink-500"
            sub="Open buyer-seller conversations"
          />
          <StatCard
            label="Approved KYC"
            value={stats?.approvedKyc ?? 0}
            icon={CheckCircle2}
            color="bg-teal-500"
            sub="Verified seller applications"
          />
        </div>
      )}

      {/* Demographics (Professions) */}
      {stats?.professions && Object.keys(stats.professions).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-4">User Demographics</h2>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(stats.professions)
                .sort((a, b) => b[1] - a[1]) // Sort by count descending
                .map(([prof, count]) => {
                const totalWithProf = Object.values(stats.professions || {}).reduce((a, b) => a + b, 0);
                const percentage = totalWithProf > 0 ? Math.round((count / totalWithProf) * 100) : 0;
                return (
                  <div key={prof} className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-slate-300">{prof}</span>
                      <span className="text-slate-400 font-mono">{count} <span className="text-slate-500 text-xs">({percentage}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-violet-600 to-violet-400 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/kyc?status=Pending"
            className="group bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/40 rounded-2xl p-6 transition-all hover:bg-slate-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <ShieldCheck className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-amber-300 transition-colors">
                  Review KYC Applications
                </p>
                <p className="text-sm text-slate-400 mt-0.5">
                  Approve or reject pending seller applications
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="group bg-slate-800/60 border border-slate-700/50 hover:border-violet-500/40 rounded-2xl p-6 transition-all hover:bg-slate-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Users className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-violet-300 transition-colors">
                  Manage Users
                </p>
                <p className="text-sm text-slate-400 mt-0.5">
                  View, suspend, or reactivate user accounts
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/security"
            className="group bg-slate-800/60 border border-slate-700/50 hover:border-red-500/40 rounded-2xl p-6 transition-all hover:bg-slate-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                <ShieldAlert className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-red-300 transition-colors">
                  Security & IPs
                </p>
                <p className="text-sm text-slate-400 mt-0.5">
                  Monitor logins and manage IP blocklist
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      {/* Reports & Exports */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">Reports & Exports</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => downloadCSV('summary')}
            className="flex items-center justify-center gap-2 bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/40 hover:bg-slate-800 text-white p-4 rounded-xl transition-all group"
          >
            <Download className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">Dashboard Stats</span>
          </button>
          
          <button
            onClick={() => downloadCSV('buyers')}
            className="flex items-center justify-center gap-2 bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/40 hover:bg-slate-800 text-white p-4 rounded-xl transition-all group"
          >
            <Download className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">Buyers List</span>
          </button>
          
          <button
            onClick={() => downloadCSV('sellers')}
            className="flex items-center justify-center gap-2 bg-slate-800/60 border border-slate-700/50 hover:border-purple-500/40 hover:bg-slate-800 text-white p-4 rounded-xl transition-all group"
          >
            <Download className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">Sellers List</span>
          </button>
          
          <button
            onClick={() => downloadCSV('kyc')}
            className="flex items-center justify-center gap-2 bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/40 hover:bg-slate-800 text-white p-4 rounded-xl transition-all group"
          >
            <Download className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">KYC Apps</span>
          </button>
        </div>
      </div>
    </div>
  );
}
