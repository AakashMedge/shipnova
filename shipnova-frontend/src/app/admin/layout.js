"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, PackagePlus, Truck, Users, LogOut, Package, CreditCard } from "lucide-react";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      router.push("/login");
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userInfo);
      if (parsedUser.role !== "Company Admin" && parsedUser.role !== "Super Admin") {
        router.push("/login");
        return;
      }
      setUser(parsedUser);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("userToken");
    router.push("/login");
  };

  if (!user) return null; // Hydration protection

  const navItems = [
    { name: "Dashboard Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Shipments", href: "/admin/shipments", icon: Truck },
    { name: "Create Shipment", href: "/admin/create", icon: PackagePlus },
    { name: "Agents", href: "/admin/team", icon: Users },
    { name: "Network Hubs", href: "/admin/hubs", icon: require("lucide-react").MapPin },
    { name: "Billing & Subscription", href: "/admin/billing", icon: CreditCard }
  ];

  return (
    <div className="flex h-screen bg-neutral-50 font-sans text-neutral-900 overflow-hidden">
      {/* Permanent Fixed Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-neutral-100 mb-6">
            <Package className="w-5 h-5 mr-3 text-indigo-600" />
            <span className="font-bold tracking-tight text-lg text-black">SHIPNOVA ADMIN</span>
          </div>
          <nav className="px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <a 
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-indigo-600" : "text-neutral-400"}`} />
                  {item.name}
                </a>
              );
            })}
          </nav>
        </div>

        {/* User Card & Authentication Exit */}
        <div className="p-4 border-t border-neutral-200">
          <div className="bg-neutral-50 rounded-lg p-4 flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold truncate text-black">{user.name}</p>
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center text-xs font-medium text-red-600 hover:text-red-700 transition-colors mt-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Secure Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Dynamic Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#fafafa]">
        <div className="p-8 lg:p-12 max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
