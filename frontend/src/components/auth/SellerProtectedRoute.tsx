import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function SellerProtectedRoute() {
  const { data: user, isLoading } = useAuth();
  const token = localStorage.getItem("token");

  // If no token at all, send to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Still fetching profile
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // If user is a buyer, redirect to KYC gatekeeper
  if (user?.role === "buyer") {
    return <Navigate to="/kyc" replace />;
  }

  // User is a seller (or admin), allow them to proceed
  return <Outlet />;
}
