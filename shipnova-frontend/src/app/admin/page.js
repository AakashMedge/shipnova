"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Package, CheckCircle2, AlertTriangle, Truck, Users,
  Activity, Loader2, Server, TrendingUp, Award, Building2,
  BarChart2, PieChart as PieIcon, Target, Zap,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xl text-xs">
      <p className="font-black text-slate-900 mb-2 uppercase tracking-wider">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 font-bold" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="text-slate-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Donut Center Label ───────────────────────────────────────────────────────
const renderDonutLabel = ({ cx, cy, total, rate }) => (
  <g>
    <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 28, fontWeight: 900 }}>
      {total}
    </text>
    <text x={cx} y={cy + 16} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11, fontWeight: 700 }}>
      SHIPMENTS
    </text>
    <text x={cx} y={cy + 32} textAnchor="middle" style={{ fontSize: 10, fontWeight: 800, fill: "#10b981" }}>
      {rate}% complete
    </text>
  </g>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent = "blue", trend }) {
  const colors = {
    blue:    { bg: "bg-blue-50",    icon: "text-blue-600",    badge: "bg-blue-50 text-blue-600" },
    indigo:  { bg: "bg-indigo-50",  icon: "text-indigo-600",  badge: "bg-indigo-50 text-indigo-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", badge: "bg-emerald-50 text-emerald-600" },
    amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   badge: "bg-amber-50 text-amber-600" },
    red:     { bg: "bg-red-50",     icon: "text-red-600",     badge: "bg-red-50 text-red-600" },
  };
  const c = colors[accent] || colors.blue;
  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className={`${c.bg} p-3 rounded-xl`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>
            {trend > 0 ? `+${trend}` : trend} today
          </span>
        )}
      </div>
      <h3 className="text-3xl font-black text-neutral-900">{value}</h3>
      <p className="text-sm text-neutral-500 font-medium mt-1">{label}</p>
      {sub && <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">{sub}</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/shipments/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mounted) setData(res.data);
      } catch (err) {
        if (err.response?.status === 403) {
           alert("Your account has been suspended by System Administration. Please contact superadmin@shipnova.com for assistance.");
           localStorage.removeItem("userToken");
           localStorage.removeItem("userInfo");
           window.location.href = "/login";
        } else {
           console.error("Failed to fetch analytics", err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAnalytics();
    
    // Real-time polling
    const intervalId = setInterval(fetchAnalytics, 10000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-neutral-500 font-semibold uppercase tracking-widest text-sm">Compiling Telemetry...</p>
      </div>
    );
  }

  const {
    metrics, totalAgents, totalShipments, completionRate,
    recentExceptions, recentActivity,
    dailyChart = [], statusDonut = [], agentLeaderboard = [], hubBreakdown = [],
  } = data;

  // Compute today's numbers from the dailyChart last entry
  const todayData = dailyChart[dailyChart.length - 1] || {};

  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto pb-12">

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-neutral-900 mb-1">
          Network Control Center
        </h1>
        <p className="text-neutral-400 font-medium text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Live analytics · Auto-refreshes every 2 min · {data._cache === "HIT" ? "📦 Cached" : "🔄 Fresh data"}
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard icon={Package}       label="Total Shipments"   value={totalShipments}     accent="blue"    trend={todayData.created} />
        <StatCard icon={Truck}         label="Active Dispatches"  value={metrics.active}     accent="indigo"  />
        <StatCard icon={CheckCircle2}  label="Delivered"          value={metrics.delivered}  accent="emerald" trend={todayData.delivered} />
        <StatCard icon={Users}         label="Registered Agents"  value={totalAgents}        accent="amber"  />
        <StatCard icon={AlertTriangle} label="Failed / Returned"  value={metrics.failed}     accent="red"     trend={todayData.failed} />
      </div>

      {/* ── Completion Rate + Donut + Bar chart row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Donut — Status Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-slate-400" />
            <h2 className="font-black text-sm text-neutral-900 tracking-tight">Status Distribution</h2>
          </div>
          {statusDonut.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDonut.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  {renderDonutLabel({ cx: "50%", cy: "50%", total: totalShipments, rate: completionRate })}
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2">
                {statusDonut.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    {d.name}: <span className="text-slate-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center opacity-30">
              <p className="text-xs font-bold uppercase tracking-widest">No data yet</p>
            </div>
          )}
        </div>

        {/* Bar Chart — 7-day trend */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-400" />
            <h2 className="font-black text-sm text-neutral-900 tracking-tight">7-Day Shipment Volume</h2>
          </div>
          {dailyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={dailyChart} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}
                />
                <Bar dataKey="created"   name="Created"   fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="delivered" name="Delivered" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="failed"    name="Failed"    fill="#f87171" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center opacity-30">
              <p className="text-xs font-bold uppercase tracking-widest">No activity in last 7 days</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Area Chart — Delivery Trend ── */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h2 className="font-black text-sm text-neutral-900 tracking-tight">Delivery Performance Trend</h2>
          <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {completionRate}% completion rate
          </span>
        </div>
        {dailyChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailyChart}>
              <defs>
                <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="created"   name="Created"   stroke="#6366f1" strokeWidth={2} fill="url(#colorCreated)"   dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} />
              <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#10b981" strokeWidth={2} fill="url(#colorDelivered)" dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center opacity-30">
            <p className="text-xs font-bold uppercase tracking-widest">No trend data available</p>
          </div>
        )}
      </div>

      {/* ── Bottom Grid: Agent Leaderboard + Hub Breakdown + Activity + Exceptions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Agent Leaderboard */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h2 className="font-black text-sm text-neutral-900 tracking-tight">Agent Leaderboard</h2>
          </div>
          {agentLeaderboard.length === 0 ? (
            <div className="flex-1 flex items-center justify-center opacity-30">
              <p className="text-xs font-bold uppercase tracking-widest">No agents yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agentLeaderboard.map((agent, i) => (
                <div key={agent.name} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                    i === 0 ? "bg-amber-100 text-amber-700" :
                    i === 1 ? "bg-slate-100 text-slate-600" :
                    i === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-50 text-slate-400"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{agent.name}</p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${agent.rate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-emerald-600">{agent.delivered}</p>
                    <p className="text-[9px] font-bold text-slate-400">{agent.rate}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hub Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <h2 className="font-black text-sm text-neutral-900 tracking-tight">Hub Performance</h2>
          </div>
          {hubBreakdown.length === 0 ? (
            <div className="flex-1 flex items-center justify-center opacity-30">
              <p className="text-xs font-bold uppercase tracking-widest">No hub data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hubBreakdown.map((hub) => (
                <div key={hub.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-xs font-bold text-slate-900 truncate">{hub.name}</p>
                    <p className="text-[10px] font-black text-indigo-600 ml-2 shrink-0">
                      {hub.delivered}/{hub.total}
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${hub.rate}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{hub.rate}% delivery rate</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Critical Exceptions */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h2 className="font-black text-sm text-neutral-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Critical Exceptions
          </h2>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm flex-1 min-h-[200px]">
            {recentExceptions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentExceptions.map((s) => (
                  <div key={s._id} className="bg-white border border-red-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-neutral-900">{s.trackingId}</span>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">
                        {new Date(s.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-red-600 font-medium">Delivery failed or returned.</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Agent: {s.agent?.name || "Unknown"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-8">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="text-emerald-800 font-bold text-sm">All operations stable.</p>
                <p className="text-emerald-600/70 text-xs font-medium mt-1">No failed deliveries.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Activity Feed ── */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-neutral-400" /> Latest Network Activity
        </h2>
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          {recentActivity.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {recentActivity.map((s) => (
                <li key={s._id} className="px-6 py-4 hover:bg-neutral-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-neutral-100 rounded-full h-10 w-10 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-neutral-900">
                        {s.customerName}{" "}
                        <span className="text-neutral-400 font-normal text-xs ml-1">({s.trackingId})</span>
                      </p>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        {s.agent ? `Handled by ${s.agent.name}` : s.hub ? `Routed → ${s.hub.name}` : "Unassigned"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-full border ${
                      s.status === "Delivered" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      s.status === "Failed / Retry / Returned" ? "bg-red-100 text-red-700 border-red-200" :
                      "bg-indigo-100 text-indigo-700 border-indigo-200"
                    }`}>
                      {s.status}
                    </span>
                    <p className="text-[9px] text-neutral-400 font-bold mt-1">
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center text-neutral-400 text-sm font-medium flex flex-col items-center gap-3">
              <Server className="w-8 h-8 opacity-20" />
              No recent activity detected.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
