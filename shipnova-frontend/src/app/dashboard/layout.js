"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, LogOut, Search, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function CustomerDashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      router.push("/login");
    } else {
      const parsed = JSON.parse(userInfo);
      // Ensure only customers use this view (or fallback gracefully)
      if (parsed.role === "Company Admin") router.push("/admin");
      else if (parsed.role === "Agent") router.push("/agent");
      else if (parsed.role === "Hub Manager") router.push("/hub-manager");
      else setUser(parsed);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] text-neutral-900 font-sans selection:bg-indigo-500/20">
      
      {/* Background Texture & Gradients */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')"}} />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-1/2 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* --- Premium Navbar --- */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ rotate: 15 }} className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Package className="w-5 h-5 text-white" />
            </motion.div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">SHIPNOVA <span className="text-neutral-400 font-medium">| Tracking</span></span>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => router.push("/track")} className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-neutral-100 rounded-full text-sm font-semibold transition-colors text-neutral-600">
                <Search className="w-4 h-4" />
                Find Package
             </button>
             <div className="h-6 w-px bg-neutral-200 hidden sm:block" />
             <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                   <div className="text-sm font-bold">{user.name}</div>
                   <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{user.email}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-indigo-600">
                   {user.name.charAt(0)}
                </div>
             </div>
             <button onClick={handleLogout} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 pb-24">
        {children}
      </main>

    </div>
  );
}
