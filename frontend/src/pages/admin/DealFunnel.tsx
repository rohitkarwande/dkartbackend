import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  TrendingUp,
  ArrowRight,
  Loader2,
  MessageSquare,
  Lock,
  CheckCircle2,
  XCircle,
  Users,
  BarChart2,
  Package,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FunnelData {
  funnel: {
    pending: number;
    in_progress: number;
    deal_locked: number;
    closed: number;
    lost: number;
    total: number;
    recent_total: number;
    conversion_rate: string;
  };
  timeline: { day: string; total_inquiries: number; deals: number }[];
  top_equipment: { id: number; title: string; inquiry_count: number; deal_count: number; conversion: string }[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
function useAdminFunnel(period: number) {
  return useQuery({
    queryKey: ["admin", "funnel", period],
    queryFn: async () => {
      const res = await api.get(`/inquiries/admin/funnel?period=${period}`);
      return res.data as FunnelData;
    },
    staleTime: 1000 * 30,
  });
}

// ─── Mini Bar ─────────────────────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Funnel Step ──────────────────────────────────────────────────────────────
function FunnelStep({
  icon: Icon,
  label,
  sublabel,
  count,
  color,
  bgColor,
  max,
  last = false,
}: {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  count: number;
  color: string;
  bgColor: string;
  max: number;
  last?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className={`w-full rounded-2xl border p-5 ${bgColor} space-y-4`}>
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${bgColor} border ${color.replace("text-", "border-")}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <span className={`text-3xl font-black ${color}`}>{count.toLocaleString()}</span>
        </div>
        <div>
          <p className={`text-sm font-bold ${color}`}>{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>
        </div>
        <MiniBar value={count} max={max} color={color.replace("text-", "bg-")} />
      </div>
      {!last && (
        <div className="flex items-center justify-center w-8 h-8">
          <ArrowRight className="h-5 w-5 text-slate-600" />
        </div>
      )}
    </div>
  );
}

// ─── Timeline Chart (pure CSS bar chart) ─────────────────────────────────────
function TimelineChart({ data }: { data: FunnelData["timeline"] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
        No data for this period
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.total_inquiries), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1.5 h-40">
        {data.map((d, i) => {
          const iqPct = (d.total_inquiries / maxVal) * 100;
          const dealPct = (d.deals / maxVal) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {new Date(d.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                <br />
                {d.total_inquiries} inquiries · {d.deals} deals
              </div>
              {/* Bars */}
              <div className="w-full flex items-end gap-0.5 h-36">
                <div
                  className="flex-1 bg-violet-500/60 rounded-t-sm transition-all"
                  style={{ height: `${iqPct}%`, minHeight: "2px" }}
                />
                <div
                  className="flex-1 bg-emerald-500 rounded-t-sm transition-all"
                  style={{ height: `${dealPct}%`, minHeight: dealPct > 0 ? "2px" : "0" }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-violet-500/60" /> Inquiries</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500" /> Deals</div>
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        {data.length > 1 && (
          <>
            <span>{new Date(data[0].day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            <span>{new Date(data[data.length - 1].day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function DealFunnel() {
  const [period, setPeriod] = useState(30);
  const { data, isLoading, error } = useAdminFunnel(period);

  const PERIODS = [
    { label: "7 days", value: 7 },
    { label: "30 days", value: 30 },
    { label: "90 days", value: 90 },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-violet-400 shrink-0" />
            Inquiry → Deal Funnel
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Track how buyer interest converts to locked deals across the platform
          </p>
        </div>
        {/* Period toggle */}
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1 overflow-x-auto hide-scrollbar self-start sm:self-auto max-w-full">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                period === p.value
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm p-4">Failed to load funnel data.</div>
      ) : data ? (
        <>
          {/* ── KPI Row ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Inquiries",
                value: data.funnel.total.toLocaleString(),
                sub: `${data.funnel.recent_total} in last ${period} days`,
                icon: Users,
                color: "text-violet-400",
                bg: "bg-violet-500/10 border-violet-500/20",
              },
              {
                label: "In Conversation",
                value: data.funnel.in_progress.toLocaleString(),
                sub: "Chat rooms opened",
                icon: MessageSquare,
                color: "text-blue-400",
                bg: "bg-blue-500/10 border-blue-500/20",
              },
              {
                label: "Deals Locked",
                value: data.funnel.deal_locked.toLocaleString(),
                sub: "Seller confirmed deal",
                icon: Lock,
                color: "text-amber-400",
                bg: "bg-amber-500/10 border-amber-500/20",
              },
              {
                label: "Conversion Rate",
                value: `${data.funnel.conversion_rate}%`,
                sub: "Inquiries → Locked Deals",
                icon: TrendingUp,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
              },
            ].map((kpi) => (
              <div key={kpi.label} className={`rounded-2xl border p-5 ${kpi.bg}`}>
                <div className="flex items-start justify-between mb-3">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  <span className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</span>
                </div>
                <p className={`text-sm font-bold ${kpi.color}`}>{kpi.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>



          {/* ── Timeline + Top Equipment ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-slate-400" />
                  Daily Trend
                </h2>
                <span className="text-xs text-slate-500">Last {period} days</span>
              </div>
              <TimelineChart data={data.timeline} />
            </div>

            {/* Top Equipment */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-6">
                <Package className="h-4 w-4 text-slate-400" />
                Top Equipment by Inquiries
              </h2>
              {data.top_equipment.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No data yet</p>
              ) : (
                <div className="space-y-4">
                  {data.top_equipment.map((eq, i) => (
                    <div key={eq.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-600 w-5 shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{eq.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div
                            className="h-1.5 rounded-full bg-violet-500/50"
                            style={{ width: `${Math.max(10, (eq.inquiry_count / data.top_equipment[0].inquiry_count) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">{eq.inquiry_count}</p>
                        <p className="text-xs text-slate-500">{eq.deal_count} deals · {eq.conversion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
