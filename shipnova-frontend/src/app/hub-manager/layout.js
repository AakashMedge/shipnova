"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  LayoutDashboard, 
  Package, 
  Users, 
  Scan, 
  LogOut, 
  Settings,
  ChevronRight,
  Bell,
  Box,
  Truck,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HubManagerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      router.push("/login"); return;
    }
    try {
      const parsedUser = JSON.parse(userInfo);
      if (parsedUser.role !== "Hub Manager") {
        router.push("/login"); return;
      }
      setUser(parsedUser);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const navItems = [
    { id: "live-terminal", name: "Live Terminal", icon: LayoutDashboard, href: "/hub-manager" },
    { id: "floor-inventory", name: "Floor Inventory", icon: Box, href: "/hub-manager" },
    { id: "agent-handover", name: "Agent Handover", icon: Truck, href: "/hub-manager/scan" },
    { id: "field-force", name: "Field Force", icon: Users, href: "/hub-manager/agents" },
    { id: "hub-chat", name: "Hub Chat", icon: MessageSquare, href: "/hub-manager/chat" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans selection:bg-red-100">
      
      {/* Black Sidebar */}
      <aside className="w-72 bg-[#0D0D0D] flex flex-col z-20 shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
              <Building2 className="text-white w-5 h-5" />
            </div>
            <div>
               <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-white">Shipnova</h1>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-0.5 mt-1 block">Facility Terminal</span>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href && !(item.id === "floor-inventory" && pathname === "/hub-manager");
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center justify-between group px-5 py-4 rounded-2xl transition-all ${
                    isActive 
                      ? "bg-white/10 text-white shadow-xl" 
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-red-500" : "group-hover:text-red-500"}`} />
                    <span className="text-sm font-black tracking-tight uppercase">{item.name}</span>
                  </div>
                  {isActive && (
                    <motion.div layoutId="nav-red-pill" className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white text-sm">
                   {user.name.charAt(0)}
                </div>
                 <div className="truncate max-w-27.5 leading-tight">
                   <p className="text-xs font-black text-white truncate mb-0.5">{user.name}</p>
                   <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Operator</p>
                </div>
             </div>
             <button 
                onClick={handleLogout}
                className="p-2.5 text-slate-600 hover:text-red-500 hover:bg-white/5 rounded-xl transition-all"
             >
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </aside>

      {/* White Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-white relative">
        <div className="p-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
