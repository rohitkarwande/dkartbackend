import { useState, useCallback } from "react";
import { useAdminUsers, useSuspendUser, useReactivateUser, type AdminUser } from "@/hooks/useAdminKyc";
import {
  Search,
  Loader2,
  ShieldOff,
  ShieldCheck,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    seller: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    buyer: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    user: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${map[role] || "bg-slate-700 text-slate-400 border-slate-600"}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ElementType; className: string }> = {
    Active: { icon: CheckCircle2, className: "text-emerald-400" },
    Suspended: { icon: ShieldOff, className: "text-red-400" },
    Blocked: { icon: XCircle, className: "text-orange-400" },
  };
  const cfg = map[status] || { icon: Clock, className: "text-slate-400" };
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmClass,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-400 py-2">{description}</p>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button>
          <Button onClick={onConfirm} disabled={isPending} className={confirmClass}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ type: "suspend" | "reactivate"; user: AdminUser } | null>(null);

  const { data: users, isLoading } = useAdminUsers({
    search: search.trim() || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const suspendMutation = useSuspendUser();
  const reactivateMutation = useReactivateUser();

  const handleAction = useCallback(() => {
    if (!confirmAction) return;
    if (confirmAction.type === "suspend") {
      suspendMutation.mutate(confirmAction.user.id, { onSuccess: () => setConfirmAction(null) });
    } else {
      reactivateMutation.mutate(confirmAction.user.id, { onSuccess: () => setConfirmAction(null) });
    }
  }, [confirmAction, suspendMutation, reactivateMutation]);

  const displayName = (u: AdminUser) =>
    [u.first_name, u.last_name].filter(Boolean).join(" ") || u.company_name || "—";

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            {users?.length ?? 0} users found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name, email, phone..."
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus-visible:ring-violet-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">All Roles</option>
          <option value="user">Buyer</option>
          <option value="buyer">Buyer (legacy)</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
          <option value="Blocked">Blocked</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        ) : !users?.length ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <User className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-semibold">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 border-b border-slate-700">
                <tr>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">KYC</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Account</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {(user.first_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{displayName(user)}</p>
                          {user.company_name && (
                            <p className="text-xs text-slate-500">{user.company_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-300">{user.email || user.phone}</p>
                      {user.email && user.phone && (
                        <p className="text-xs text-slate-500">{user.phone}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="p-4">
                      {user.kyc_status ? (
                        <span className={`text-xs font-semibold ${
                          user.kyc_status === "Approved" ? "text-emerald-400" :
                          user.kyc_status === "Rejected" ? "text-red-400" : "text-amber-400"
                        }`}>
                          {user.kyc_status}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">None</span>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-500">
                        {new Date(user.created_at).toLocaleDateString("en-IN")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {user.role !== "admin" && (
                        user.status === "Suspended" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300 text-xs h-8"
                            onClick={() => setConfirmAction({ type: "reactivate", user })}
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:bg-red-900/20 hover:text-red-300 text-xs h-8"
                            onClick={() => setConfirmAction({ type: "suspend", user })}
                          >
                            <ShieldOff className="h-3.5 w-3.5 mr-1" />
                            Suspend
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleAction}
          title={confirmAction.type === "suspend" ? "Suspend User Account" : "Reactivate User Account"}
          description={
            confirmAction.type === "suspend"
              ? `Are you sure you want to suspend ${displayName(confirmAction.user)}? They will lose access to the platform.`
              : `Reactivate ${displayName(confirmAction.user)}'s account? They will regain full platform access.`
          }
          confirmLabel={confirmAction.type === "suspend" ? "Suspend Account" : "Reactivate Account"}
          confirmClass={confirmAction.type === "suspend" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
          isPending={suspendMutation.isPending || reactivateMutation.isPending}
        />
      )}
    </div>
  );
}
