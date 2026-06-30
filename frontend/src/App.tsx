import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { DashboardOverview } from "./pages/dashboard/Overview";
import { SellEquipment } from "./pages/dashboard/SellEquipment";
import { Listings } from "./pages/dashboard/Listings";
import { Inquiries } from "./pages/dashboard/Inquiries";
import { Chat } from "./pages/dashboard/Chat";
import { Profile } from "./pages/dashboard/Profile";
import { Home } from "./pages/marketplace/Home";
import { Search } from "./pages/marketplace/Search";
import { EquipmentDetails } from "./pages/marketplace/EquipmentDetails";
import { AuthPage } from "./pages/auth/AuthPage";
import { KycVerification } from "./pages/auth/KycVerification";
import { SellerProtectedRoute } from "./components/auth/SellerProtectedRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminProtectedRoute } from "./components/auth/AdminProtectedRoute";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { KycApplications } from "./pages/admin/KycApplications";
import { DealFunnel } from "./pages/admin/DealFunnel";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminSecurity } from "./pages/admin/AdminSecurity";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRoleSync } from "./hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

// Mounts the real-time role sync socket listener globally
// Shows a toast notification when admin approves/rejects
function RoleSyncMount() {
  useRoleSync((data) => {
    if (data.role === "seller") {
      // Show a prominent browser notification or use a simple alert-style DOM message
      // We'll use the browser's built-in notification if available, fallback to alert
      const msg = data.message || "🎉 Your Seller account has been approved!";
      // Create a visible in-page toast by dispatching a custom event
      window.dispatchEvent(new CustomEvent("role-update-toast", { detail: { message: msg, type: "success" } }));
    } else if (data.kycStatus === "Rejected") {
      window.dispatchEvent(new CustomEvent("role-update-toast", { detail: { message: data.message, type: "error" } }));
    }
  });
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RoleSyncMount />
        <ToastListener />
        <Routes>
          {/* ── ADMIN ROUTES (separate from main layout) ── */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="kyc" element={<KycApplications />} />
              <Route path="deals" element={<DealFunnel />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="security" element={<AdminSecurity />} />
            </Route>
          </Route>

          {/* All routes wrapped in MainLayout (gives TopNavbar + Footer) */}
          <Route element={<MainLayout />}>
            {/* ── PUBLIC MARKETPLACE ROUTES ── */}
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/equipment/:id" element={<EquipmentDetails />} />

            {/* ── AUTH ROUTES ── */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/kyc" element={<KycVerification />} />

            {/* ── DASHBOARD ROUTES (with sidebar) ── */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardOverview />} />
              <Route path="listings" element={<Listings />} />
              <Route path="inquiries" element={<Inquiries />} />
              <Route path="profile" element={<Profile />} />
              <Route path="chat" element={<Chat />} />
            </Route>

            {/* ── SELLER-ONLY ROUTE (gated by KYC/role) ── */}
            <Route element={<SellerProtectedRoute />}>
              <Route path="/sell" element={<SellEquipment />} />
              <Route path="/edit/:id" element={<SellEquipment />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// ── Simple in-page toast for role updates ─────────────────────────────────────
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

function ToastListener() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setToast(detail);
      setTimeout(() => setToast(null), 6000);
    };
    window.addEventListener("role-update-toast", handler);
    return () => window.removeEventListener("role-update-toast", handler);
  }, []);

  if (!toast) return null;

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-start gap-3 max-w-sm p-4 rounded-2xl shadow-2xl border text-white animate-in slide-in-from-top-2 duration-300 ${
        toast.type === "success"
          ? "bg-emerald-800 border-emerald-600"
          : "bg-red-900 border-red-700"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-red-300 shrink-0 mt-0.5" />
      )}
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
    </div>
  );
}

export default App;
