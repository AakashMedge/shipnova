"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Package, 
  MapPin, 
  ArrowRight,
  Box,
  Truck,
  UserCircle,
  Clock,
  CheckCircle2,
  RefreshCcw,
  Building2,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function CustomerDashboardPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/shipments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShipments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
    // Live polling every 15 seconds to simulate real-time updates without websockets
    const interval = setInterval(fetchShipments, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
     <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
           <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest animate-pulse">Syncing Shipments...</p>
        </div>
     </div>
  );

  const activeShipments = shipments.filter(s => s.status !== "Delivered" && s.status !== "Failed / Retry / Returned");

  return (
    <div className="flex flex-col gap-12">
      
      {/* --- Greetings --- */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900">
           Welcome Back.
        </h1>
        <p className="text-lg text-neutral-500 font-medium">
           You have <span className="text-indigo-600 font-bold">{activeShipments.length}</span> active deliveries incoming.
        </p>
      </motion.section>

      {/* --- Active Shipments Feed --- */}
      <section className="flex flex-col gap-6">
         {shipments.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/50 backdrop-blur border border-neutral-200 rounded-3xl p-12 text-center shadow-lg shadow-black/5 flex flex-col items-center justify-center">
               <Package className="w-16 h-16 text-neutral-300 mb-6" />
               <h3 className="text-xl font-bold text-neutral-900 mb-2">No shipments yet!</h3>
               <p className="text-neutral-500 max-w-sm mb-8">When you order from a partner using Shipnova, your packages will automatically appear here based on your email.</p>
               <button onClick={() => router.push("/track")} className="bg-black hover:bg-neutral-800 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all">
                 <Search className="w-4 h-4" /> Track by ID manually
               </button>
            </motion.div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <AnimatePresence>
                  {shipments.map((shipment, i) => {
                     const isDelivered = shipment.status === "Delivered";
                     const isActive = !isDelivered;

                     return (
                        <motion.div 
                           key={shipment._id}
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: i * 0.1 }}
                           className={`bg-white rounded-3xl border border-neutral-100 p-6 md:p-8 flex flex-col gap-6 shadow-xl relative overflow-hidden transition-all ${isDelivered ? 'opacity-70 saturate-50' : 'shadow-indigo-500/10 hover:shadow-indigo-500/20'}`}
                        >
                           {/* Glow Effect */}
                           {isActive && <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />}

                           {/* Header */}
                           <div className="flex justify-between items-start z-10">
                              <div>
                                 <div className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase mb-1 flex items-center gap-2">
                                    <Box className="w-3 h-3" /> {shipment.trackingId}
                                 </div>
                                 <h2 className="text-xl md:text-2xl font-black text-neutral-900">{shipment.packageDetails || "Standard Package"}</h2>
                              </div>
                              <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border ${
                                 isDelivered ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                 shipment.status === "In Transit" ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                 "bg-amber-50 text-amber-600 border-amber-100"
                              }`}>
                                 {shipment.status}
                              </span>
                           </div>

                           {/* Logistics Info (Tenant / Driver) */}
                           <div className="flex items-center gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-100 z-10 flex-wrap">
                              <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                                 <Building2 className="w-4 h-4 text-neutral-400 shrink-0" />
                                 <div className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">Logistics Carrier</span>
                                    <span className="text-sm font-bold text-neutral-700 truncate">{shipment.tenant_id?.name || "Independent"}</span>
                                 </div>
                              </div>
                              <div className="w-px h-8 bg-neutral-200 hidden sm:block" />
                              <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                                 <UserCircle className="w-4 h-4 text-neutral-400 shrink-0" />
                                 <div className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">Delivery Driver</span>
                                    <span className="text-sm font-bold text-neutral-700 truncate">{shipment.agent?.name || "Pending Assignment"}</span>
                                 </div>
                              </div>
                           </div>

                           {/* Destination */}
                           <div className="flex items-start gap-3 z-10 mb-4">
                              <div className="bg-neutral-100 p-2 rounded-full shrink-0 mt-0.5">
                                 <MapPin className="w-4 h-4 text-neutral-500" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold text-neutral-900 shrink-0">Destination</span>
                                 <p className="text-sm text-neutral-500 leading-relaxed font-medium">{shipment.address}</p>
                              </div>
                           </div>

                           {/* View Details Action */}
                           <button onClick={() => router.push(`/track?id=${shipment.trackingId}`)} className="mt-auto z-10 w-full py-4 rounded-xl border border-neutral-200 font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors">
                              View Full Timeline <ArrowRight className="w-4 h-4" />
                           </button>

                        </motion.div>
                     );
                  })}
               </AnimatePresence>
            </div>
         )}
      </section>

    </div>
  );
}
