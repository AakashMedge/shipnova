"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldCheck, Building2, Server, LogOut, UserCheck, CreditCard } from "lucide-react";

export default function SuperAdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Don't guard the login page itself
    if (pathname === "/super-admin/login") return;

    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      router.push("/super-admin/login");
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userInfo);
      // STRICT RBAC CHECK - Industry Standard Route Guards
      if (parsedUser.role !== "Super Admin") {
        router.push("/super-admin/login");
        return;
      }
      setUser(parsedUser);
    } catch (e) {
      router.push("/super-admin/login");
    }
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("userToken");
    router.push("/super-admin/login");
  };

  // Don't apply layout to the login page
  if (pathname === "/super-admin/login") return <>{children}</>;
  
  if (!user) return null; // Hydration projection

  const navItems = [
    { name: "Platform Overview", href: "/super-admin", icon: Server },
    { name: "Tenant Logistics", href: "/super-admin/tenants", icon: Building2 },
    { name: "Subscription Plans", href: "/super-admin/plans", icon: CreditCard },
    { name: "Admin Requests", href: "/super-admin/admin-requests", icon: UserCheck },
  ];

  return (
    <div className="flex h-screen bg-neutral-900 font-sans text-neutral-100 overflow-hidden">
      {/* Super Admin Dark Mode Sidebar Pattern */}
      <aside className="w-64 bg-black border-r border-neutral-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-neutral-800 mb-6">
            <ShieldCheck className="w-5 h-5 mr-3 text-cyan-500" />
            <span className="font-bold tracking-tight text-lg text-white">SYSTEM ADMIN</span>
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
                      ? "bg-neutral-800 text-cyan-400" 
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-cyan-400" : "text-neutral-500"}`} />
                  {item.name}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-800">
          <div className="bg-neutral-900 rounded-lg p-4 flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold truncate text-white">{user.name}</p>
              <p className="text-xs text-neutral-400 truncate">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center text-xs font-medium text-red-500 hover:text-red-400 transition-colors mt-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Terminate Session
            </button>
          </div>
        </div>
      </aside>

      {/* Main Dynamic Content Area */}
      <main className="flex-1 overflow-y-auto bg-neutral-900 text-white">
        <div className="p-8 lg:p-12 max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
