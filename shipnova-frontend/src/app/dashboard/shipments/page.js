"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Package, Search, ChevronRight, Activity, Clock, Box, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CustomerShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/shipments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShipments(data);
    } catch (error) {
      console.error("Dashboard error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = shipments.filter(s => 
    s.trackingId.toLowerCase().includes(search.toLowerCase()) ||
    s.packageDetails.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-20 text-indigo-400 font-bold animate-pulse text-center">Loading your package history...</div>;

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-black uppercase text-indigo-600 tracking-[0.15em]">Verified Account</span>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">My Shipments</h2>
           <p className="text-slate-400 font-medium tracking-tight text-sm">Managing all your active and historic package orders.</p>
        </div>
        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input 
              type="text"
              placeholder="Filter by Tracking ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all w-full md:w-64"
           />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden min-h-[400px]">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-50">
                     <th className="px-10 py-6">Identity</th>
                     <th className="px-10 py-6">Current_Flow</th>
                     <th className="px-10 py-6">Carrier</th>
                     <th className="px-10 py-6 text-right pr-12">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 italic">
                  {filtered.map((s, i) => (
                     <tr key={s._id} className="hover:bg-slate-50/50 transition-all group border-l-4 border-l-transparent hover:border-l-indigo-500">
                        <td className="px-10 py-8">
                           <p className="font-mono text-sm tracking-tighter font-black text-slate-900 uppercase">{s.trackingId}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">{s.packageDetails}</p>
                        </td>
                        <td className="px-10 py-8">
                           <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                              s.status === "Delivered" 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : "bg-indigo-50 text-indigo-600 border-indigo-100"
                           }`}>
                              {s.status}
                           </span>
                        </td>
                        <td className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                           {s.tenant_id?.name || "Global Network"}
                        </td>
                        <td className="px-10 py-8 text-right pr-12">
                           <Link 
                              href={`/track?id=${s.trackingId}`}
                              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-slate-900 transition-colors"
                           >
                              Visual Trace
                              <ArrowRight className="w-4 h-4" />
                           </Link>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         {filtered.length === 0 && (
            <div className="p-24 text-center flex flex-col items-center gap-4">
               <Box className="w-12 h-12 text-slate-100 stroke-[1.5]" />
               <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No matching shipments found in your vault.</p>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
         <div className="p-8 bg-slate-900 rounded-[35px] text-white flex items-center justify-between shadow-xl shadow-slate-200">
            <div>
               <h4 className="text-xl font-black tracking-tighter mb-1">Instant Tracking</h4>
               <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Enter a specific ID to start a live visual trace.</p>
            </div>
            <Link href="/track" className="size-12 bg-white text-black rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
               <Search className="w-5 h-5" />
            </Link>
         </div>

         <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[35px] flex items-center justify-between">
            <div>
               <h4 className="text-xl font-black tracking-tighter text-slate-900 mb-1">Help & Support</h4>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Got an issue? Reach out to our 24/7 terminal assistance.</p>
            </div>
            <div className="size-12 bg-white border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
               <Activity className="w-5 h-5" />
            </div>
         </div>
      </div>
    </div>
  );
}
