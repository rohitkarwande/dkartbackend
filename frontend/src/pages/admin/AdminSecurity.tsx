import { useState } from "react";
import {
  useLoginHistory,
  useIpBlacklist,
  useAddIpToBlacklist,
  useRemoveIpFromBlacklist,
} from "@/hooks/useAdminKyc";
import {
  ShieldAlert,
  Search,
  Loader2,
  Trash2,
  Plus,
  ShieldCheck,
  History,
  Ban,
  Monitor,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function AdminSecurity() {
  const [activeTab, setActiveTab] = useState<"history" | "blacklist">("history");
  const [searchQuery, setSearchQuery] = useState("");
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");

  const { data: loginHistory, isLoading: isLoadingHistory } = useLoginHistory(searchQuery);
  const { data: blacklist, isLoading: isLoadingBlacklist } = useIpBlacklist();
  
  const { mutate: addIp, isPending: isAddingIp } = useAddIpToBlacklist();
  const { mutate: removeIp, isPending: isRemovingIp } = useRemoveIpFromBlacklist();

  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    addIp(
      { ip_address: newIp.trim(), reason: newReason.trim() },
      {
        onSuccess: () => {
          setNewIp("");
          setNewReason("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            Security & IP Management
          </h1>
          <p className="text-slate-400 mt-1">
            Monitor login activity and block suspicious IP addresses.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "history"
              ? "bg-slate-700 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          }`}
        >
          <History className="h-4 w-4" />
          Login History
        </button>
        <button
          onClick={() => setActiveTab("blacklist")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "blacklist"
              ? "bg-red-500/20 text-red-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          }`}
        >
          <Ban className="h-4 w-4" />
          IP Blacklist
        </button>
      </div>

      {activeTab === "history" ? (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by Email, Phone, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-800/80">
                    <th className="p-4 text-sm font-semibold text-slate-300">User / Role</th>
                    <th className="p-4 text-sm font-semibold text-slate-300">IP Address</th>
                    <th className="p-4 text-sm font-semibold text-slate-300">Device / Browser</th>
                    <th className="p-4 text-sm font-semibold text-slate-300">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading history...
                      </td>
                    </tr>
                  ) : loginHistory?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        No login history found.
                      </td>
                    </tr>
                  ) : (
                    loginHistory?.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-white">{record.email || record.phone}</div>
                          <div className="text-xs text-slate-400 mt-1 capitalize">
                            {record.role}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 font-mono text-sm text-slate-300">
                            {record.ip_address}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-slate-300 max-w-[200px] sm:max-w-xs truncate" title={record.user_agent}>
                            <Monitor className="h-4 w-4 shrink-0 text-slate-500" />
                            <span className="truncate">{record.user_agent}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-400">
                          {format(new Date(record.created_at), "MMM d, yyyy h:mm a")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Blacklist Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-400" />
                Block New IP
              </h3>
              <form onSubmit={handleAddBlacklist} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    IP Address
                  </label>
                  <Input
                    required
                    placeholder="e.g. 192.168.1.1"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    className="bg-slate-900 border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Reason (Optional)
                  </label>
                  <Input
                    placeholder="Why is this blocked?"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="bg-slate-900 border-slate-700"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isAddingIp || !newIp.trim()} 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {isAddingIp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Block IP
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Blacklist Table */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/80">
                      <th className="p-4 text-sm font-semibold text-slate-300">IP Address</th>
                      <th className="p-4 text-sm font-semibold text-slate-300">Reason</th>
                      <th className="p-4 text-sm font-semibold text-slate-300">Blocked On</th>
                      <th className="p-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {isLoadingBlacklist ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          Loading blacklist...
                        </td>
                      </tr>
                    ) : blacklist?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                          No IP addresses are currently blocked.
                        </td>
                      </tr>
                    ) : (
                      blacklist?.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-sm">
                              {record.ip_address}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-300">
                            {record.reason || <span className="text-slate-500 italic">No reason provided</span>}
                          </td>
                          <td className="p-4 text-sm text-slate-400">
                            {format(new Date(record.created_at), "MMM d, yyyy")}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                              onClick={() => {
                                if (confirm(`Are you sure you want to unblock ${record.ip_address}?`)) {
                                  removeIp(record.ip_address);
                                }
                              }}
                              disabled={isRemovingIp}
                            >
                              <ShieldCheck className="h-4 w-4 mr-1.5" />
                              Unblock
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
