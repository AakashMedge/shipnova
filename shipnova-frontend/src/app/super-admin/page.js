"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Server, Activity, Users, Building } from "lucide-react";

export default function SuperAdminOverview() {
  const [stats, setStats] = useState({
    tenants: 0,
    activeShipments: 0,
    systemUptime: "99.99%",
    globalUsers: 0,
    pendingApprovals: 0,
    estimatedRevenue: "$0"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch system stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Active Tenant Companies", value: stats.tenants, icon: Building, color: "text-cyan-400", bg: "bg-cyan-900/20", border: "border-cyan-800" },
    { label: "Global Packets In-Flight", value: stats.activeShipments, icon: Activity, color: "text-indigo-400", bg: "bg-indigo-900/20", border: "border-indigo-800" },
    { label: "Platform Users", value: stats.globalUsers, icon: Users, color: "text-emerald-400", bg: "bg-emerald-900/20", border: "border-emerald-800" },
    { 
      label: "Estimated Revenue", 
      value: stats.estimatedRevenue, 
      icon: require("lucide-react").BadgeDollarSign, 
      color: "text-amber-400", 
      bg: "bg-amber-900/20", 
      border: "border-amber-800" 
    },
    { 
      label: "System Status", 
      value: stats.systemUptime, 
      icon: Server, 
      color: "text-cyan-400", 
      bg: "bg-cyan-900/20", 
      border: "border-cyan-800" 
    },
    { 
      label: "Pending Approvals", 
      value: stats.pendingApprovals, 
      icon: require("lucide-react").AlertTriangle, 
      color: stats.pendingApprovals > 0 ? "text-rose-400" : "text-neutral-500", 
      bg: stats.pendingApprovals > 0 ? "bg-rose-900/20" : "bg-neutral-900", 
      border: stats.pendingApprovals > 0 ? "border-rose-800" : "border-neutral-800" 
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Platform Telemetry</h1>
        <p className="text-neutral-400 font-medium">Global operational metrics for the entire Shipnova infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`bg-black p-6 rounded-2xl border ${stat.border} shadow-lg flex flex-col justify-between`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-bold tracking-tight text-white mb-1">{stat.value}</h3>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-black border border-neutral-800 rounded-2xl shadow-lg p-8 mt-4 flex flex-col items-center justify-center text-center h-64 border-dashed">
         <p className="text-neutral-500 font-medium mb-2">Global Data Visualization Node (Node.js Aggregation)</p>
         <p className="text-sm text-neutral-600">Pending real-time WebSocket integration for live macro-tracking.</p>
      </div>
    </div>
  );
}
