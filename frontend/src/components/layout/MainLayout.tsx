import { Outlet } from "react-router-dom";
import { TopNavbar } from "./TopNavbar";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <TopNavbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-600 p-1.5 rounded-lg">
                  <span className="text-white font-bold text-lg leading-none block">dk</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-white">
                  Dr.<span className="text-emerald-500">Kart</span>
                </span>
              </div>
              <p className="text-sm">India's trusted B2B healthcare equipment marketplace for hospitals, clinics, and diagnostic centers.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Marketplace</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/search" className="hover:text-emerald-400 transition-colors">Browse All Equipment</a></li>
                <li><a href="/search?category=MRI" className="hover:text-emerald-400 transition-colors">MRI Machines</a></li>
                <li><a href="/search?category=Ultrasound" className="hover:text-emerald-400 transition-colors">Ultrasound</a></li>
                <li><a href="/search?condition=Refurbished" className="hover:text-emerald-400 transition-colors">Refurbished Devices</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Sellers</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/kyc" className="hover:text-emerald-400 transition-colors">Start Selling</a></li>
                <li><a href="/dashboard/listings" className="hover:text-emerald-400 transition-colors">My Listings</a></li>
                <li><a href="/dashboard/inquiries" className="hover:text-emerald-400 transition-colors">Manage Inquiries</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <span>&copy; {new Date().getFullYear()} Dr.Kart Marketplace. All rights reserved.</span>
            <span className="text-slate-500">Made for India's Healthcare Ecosystem</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
