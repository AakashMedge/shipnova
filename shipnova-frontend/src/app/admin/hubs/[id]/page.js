"use client";

import React, { useEffect, useState, use } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Box, MapPin, User, Search, Package, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function HubDetailsPage({ params }) {
  const { id } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHubDetails = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(data);
    } catch (error) {
      console.error("Failed to fetch hub details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubDetails();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen py-12 px-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
    </div>
  );

  if (!data) return <div className="p-8 font-bold text-red-500">Hub telemetry unavailable.</div>;

  const filteredShipments = data.shipments.filter(s => 
    s.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/admin/hubs" className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{data.hub.name}</h1>
          <p className="text-black/50 text-sm font-medium">Warehouse Terminal ID: {data.hub._id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Metadata */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
              <div className="space-y-1">
                 <span className="text-[10px] font-black uppercase tracking-widest text-black/30">Location Terminal</span>
                 <div className="flex items-start gap-2 text-black font-bold">
                    <MapPin className="w-4 h-4 mt-1 shrink-0" />
                    <p className="text-sm leading-relaxed">{data.hub.location}</p>
                 </div>
              </div>

              <div className="pt-6 border-t border-black/5">
                 <span className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-4 block">Warehouse Manager</span>
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
                       <User className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="font-bold text-black">{data.hub.manager?.name || "Unassigned"}</p>
                       <p className="text-xs text-black/50">{data.hub.manager?.email || "No email linked"}</p>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-black/5">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black text-white p-4 rounded-2xl flex flex-col gap-1">
                       <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Stored Boxes</span>
                       <span className="text-2xl font-black">{data.shipments.length}</span>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 p-4 rounded-2xl flex flex-col gap-1">
                       <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Inbound Flow</span>
                       <span className="text-2xl font-black">Stable</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-4">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <p className="text-[11px] font-medium text-emerald-800 leading-relaxed">
                 This facility is currently operational. All packages stored here are protected by end-to-end cryptographic verification.
              </p>
           </div>
        </div>

        {/* Right Column: Inventory List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
           <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-black tracking-tight">Active Inventory</h3>
              <div className="relative flex-1 max-w-xs ml-auto">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
                 <input 
                    type="text"
                    placeholder="Search box or tracking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-black/10 rounded-xl text-sm outline-none focus:border-black transition-colors"
                 />
              </div>
           </div>

           <div className="bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-black/5 text-[10px] font-black uppercase tracking-widest text-black/40 border-b border-black/5">
                       <th className="px-6 py-4">Package ID</th>
                       <th className="px-6 py-4">Consignee</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">Last Event</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-black/5">
                    {filteredShipments.map((s, i) => (
                       <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={s._id} 
                          className="hover:bg-black/2 transition-colors cursor-pointer group"
                       >
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <Box className="w-4 h-4 text-black/30" />
                                <span className="text-xs font-black tracking-widest uppercase">{s.trackingId}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-sm font-bold text-black">{s.customerName}</p>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/5 text-black/60`}>
                                {s.status}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-black/40 uppercase tracking-widest">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(s.updatedAt).toLocaleDateString()}
                             </div>
                          </td>
                       </motion.tr>
                    ))}
                    {filteredShipments.length === 0 && (
                       <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                             <Package className="w-12 h-12 text-black/10 mx-auto mb-3" />
                             <p className="text-sm font-bold text-black/30 uppercase tracking-[0.2em]">No inventory recorded</p>
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}
