import { useState, useCallback } from "react";
import {
  useKycApplications,
  useApproveKyc,
  useRejectKyc,
  type KycApplication,
} from "@/hooks/useAdminKyc";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  Download,
  ChevronLeft,
  AlertCircle,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { API_BASE_URL as API_BASE } from "@/lib/api";

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    Pending: { label: "Pending", className: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: Clock },
    Approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
    Rejected: { label: "Rejected", className: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle },
  };
  const cfg = map[status] || map.Pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── Document Preview ─────────────────────────────────────────────────────────
function DocumentPreview({ fileUrl, docUrl }: { fileUrl: string | null; docUrl: string | null }) {
  if (!fileUrl && !docUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-slate-800 rounded-xl border border-slate-700 text-slate-500">
        <FileText className="h-8 w-8 mb-2" />
        <span className="text-sm">No document uploaded</span>
      </div>
    );
  }

  if (fileUrl) {
    const fullUrl = `${API_BASE}${fileUrl}`;
    const isPdf = fileUrl.toLowerCase().endsWith(".pdf");
    return (
      <div className="space-y-2">
        {isPdf ? (
          <div className="flex flex-col items-center justify-center h-40 bg-slate-800 rounded-xl border border-slate-700">
            <FileText className="h-10 w-10 text-slate-400 mb-2" />
            <span className="text-xs text-slate-400">PDF Document</span>
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              Open / Download PDF
            </a>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
            <img
              src={fullUrl}
              alt="KYC Document"
              className="w-full max-h-64 object-contain p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="p-2 border-t border-slate-700 flex justify-end">
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
              >
                <Download className="h-3 w-3" /> Full size
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Text-based reference
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Document Reference</p>
      <p className="text-sm text-slate-200 font-mono break-all">{docUrl}</p>
    </div>
  );
}

// ─── Reject Dialog ────────────────────────────────────────────────────────────
function RejectDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
  userName: string;
}) {
  const [reason, setReason] = useState("");
  const handleSubmit = () => {
    if (reason.trim().length < 10) return;
    onConfirm(reason.trim());
    setReason("");
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-400 flex items-center gap-2">
            <XCircle className="h-5 w-5" /> Reject KYC Application
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-400">
            You are rejecting the application for <strong className="text-white">{userName}</strong>. They will be notified with your reason.
          </p>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Rejection Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-red-500/70 focus:ring-1 focus:ring-red-500/40"
              rows={4}
              placeholder="e.g. Document image is unclear, please re-upload a clearer photo of your GST certificate..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">Minimum 10 characters required</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-slate-400">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reason.trim().length < 10 || isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
            Reject Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Approve Dialog ───────────────────────────────────────────────────────────
function ApproveDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  userName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Approve Seller Application
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-slate-300">
            You are approving the seller application for{" "}
            <strong className="text-white">{userName}</strong>.
          </p>
          <div className="mt-4 bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4 space-y-2">
            <p className="text-xs text-emerald-300 font-semibold">This will:</p>
            <ul className="text-xs text-emerald-200/80 space-y-1 list-disc list-inside">
              <li>Promote their role from Buyer → Seller immediately</li>
              <li>Grant access to Sell Equipment, Inventory, and Listings</li>
              <li>Send them a real-time notification (no logout required)</li>
              <li>Log this action in the audit trail</li>
            </ul>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-slate-400">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Approve & Grant Seller Access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function KycDetailPanel({
  app,
  onClose,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  app: KycApplication;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const displayName =
    [app.first_name, app.last_name].filter(Boolean).join(" ") ||
    app.company_name ||
    app.email ||
    app.phone ||
    `User #${app.user_id}`;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">{displayName}</h2>
          <p className="text-sm text-slate-400 mt-0.5">KYC Application Review</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <StatusBadge status={app.kyc_status} />
          {app.rejection_reason && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Has rejection reason
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant Information</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="text-slate-200">{displayName}</span>
            </div>
            {app.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-slate-200">{app.email}</span>
              </div>
            )}
            {app.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-slate-200">{app.phone}</span>
              </div>
            )}
            {app.company_name && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-slate-200">{app.company_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="text-slate-400">Registered: {formatDate(app.user_created_at)}</span>
            </div>
          </div>
        </div>

        {/* Document Details */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Details</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Type</span>
              <span className="text-sm font-semibold text-white">{app.document_type?.replace(/_/g, " ")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Submitted</span>
              <span className="text-sm text-slate-300">{formatDate(app.submitted_at)}</span>
            </div>
            {app.reviewed_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Reviewed</span>
                <span className="text-sm text-slate-300">{formatDate(app.reviewed_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Document Preview */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Preview</p>
          <DocumentPreview fileUrl={app.document_file_url} docUrl={app.document_url} />
        </div>

        {/* Rejection Reason */}
        {app.rejection_reason && (
          <div className="bg-red-900/10 border border-red-700/30 rounded-xl p-4">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Previous Rejection Reason</p>
            <p className="text-sm text-red-200">{app.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {app.kyc_status === "Pending" && (
        <div className="p-6 border-t border-slate-800 space-y-3">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
            onClick={() => setShowApproveDialog(true)}
            disabled={isApproving || isRejecting}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve & Grant Seller Access
          </Button>
          <Button
            variant="outline"
            className="w-full border-red-600/40 text-red-400 hover:bg-red-900/20 hover:border-red-500 font-semibold h-11"
            onClick={() => setShowRejectDialog(true)}
            disabled={isApproving || isRejecting}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject with Reason
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <ApproveDialog
        open={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={() => { setShowApproveDialog(false); onApprove(); }}
        isPending={isApproving}
        userName={displayName}
      />
      <RejectDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={(reason) => { setShowRejectDialog(false); onReject(reason); }}
        isPending={isRejecting}
        userName={displayName}
      />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function KycApplications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<KycApplication | null>(null);

  const statusFilter = searchParams.get("status") || "all";

  const { data: apps, isLoading } = useKycApplications({
    status: statusFilter,
    search: search.trim() || undefined,
  });

  const approveMutation = useApproveKyc();
  const rejectMutation = useRejectKyc();

  const handleApprove = useCallback((userId: number) => {
    approveMutation.mutate(userId, {
      onSuccess: () => {
        setSelectedApp((prev) => prev ? { ...prev, kyc_status: "Approved" } : null);
      },
    });
  }, [approveMutation]);

  const handleReject = useCallback((userId: number, reason: string) => {
    rejectMutation.mutate({ userId, reason }, {
      onSuccess: () => {
        setSelectedApp((prev) => prev ? { ...prev, kyc_status: "Rejected", rejection_reason: reason } : null);
      },
    });
  }, [rejectMutation]);

  const STATUS_TABS = [
    { key: "all", label: "All" },
    { key: "Pending", label: "Pending" },
    { key: "Approved", label: "Approved" },
    { key: "Rejected", label: "Rejected" },
  ];

  const displayName = (app: KycApplication) =>
    [app.first_name, app.last_name].filter(Boolean).join(" ") ||
    app.company_name || app.email || app.phone || `User #${app.user_id}`;

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen relative overflow-hidden">
      {/* Left panel: list */}
      <div className={`flex flex-col ${selectedApp ? "hidden md:flex md:w-1/2" : "w-full"} transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">KYC Applications</h1>
            <span className="text-sm text-slate-500">{apps?.length ?? 0} results</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by name, email, phone, company..."
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus-visible:ring-violet-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 overflow-x-auto hide-scrollbar">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSearchParams(tab.key === "all" ? {} : { status: tab.key })}
                className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === tab.key
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
            </div>
          ) : !apps?.length ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <FileText className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-semibold">No applications found</p>
              <p className="text-sm mt-1">Try a different filter</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 pb-16 md:pb-0">
              {apps.map((app) => (
                <button
                  key={app.kyc_id}
                  onClick={() => setSelectedApp(app)}
                  className={`w-full text-left p-4 md:p-5 hover:bg-slate-800/50 transition-colors group ${
                    selectedApp?.kyc_id === app.kyc_id ? "bg-slate-800/80 border-l-2 border-violet-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-white truncate">{displayName(app)}</p>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {app.email || app.phone}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded font-medium">
                          {app.document_type?.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-slate-600">
                          {new Date(app.submitted_at).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <StatusBadge status={app.kyc_status} />
                      <Eye className="h-4 w-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: detail */}
      {selectedApp && (
        <div className="w-full md:w-1/2 border-l border-slate-800 absolute inset-0 z-50 md:static md:z-auto bg-slate-900 transition-all duration-300 pb-16 md:pb-0">
          <KycDetailPanel
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onApprove={() => handleApprove(selectedApp.user_id)}
            onReject={(reason) => handleReject(selectedApp.user_id, reason)}
            isApproving={approveMutation.isPending}
            isRejecting={rejectMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}
