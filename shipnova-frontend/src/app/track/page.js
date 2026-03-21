"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Truck, MapPin, Calendar, Package, ArrowLeft, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TrackingPage() {
  const [trackingId, setTrackingId] = useState("");
  const [activeTrackingId, setActiveTrackingId] = useState("");
  const [shipmentData, setShipmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId) return;
    setLoading(true);
    setError("");
    setActiveTrackingId(""); // reset polling until new fetch succeeds

    try {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/shipments/track/${trackingId}`);
      setShipmentData(data);
      setActiveTrackingId(trackingId); // start background polling
    } catch (err) {
      setShipmentData(null);
      setError(err.response?.data?.message || "Tracking ID not found");
    } finally {
      setLoading(false);
    }
  };

  // ── LIVE POLLING (Every 10s) ──
  useEffect(() => {
    if (!activeTrackingId) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/shipments/track/${activeTrackingId}`);
        setShipmentData(data); // update silently in background
      } catch (err) {
        console.error("Silent background fetch failed:", err);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTrackingId]);

  return (
    <div className="min-h-screen p-4 sm:p-8 md:p-16 lg:px-24 bg-[#fdfdfd] overflow-hidden selection:bg-black/10 font-sans text-neutral-900">
      
      {/* Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')"}} />

      {/* --- Top Navbar --- */}
      <nav className="relative z-50 flex justify-between items-center mb-12 md:mb-24 max-w-7xl mx-auto">
         <a href="/" className="flex items-center gap-2 group">
            <motion.div whileHover={{ rotate: 15 }} className="bg-neutral-900 p-1.5 rounded-md text-white">
               <Package size={18} />
            </motion.div>
            <span className="font-bold text-xl tracking-tight">SHIPNOVA</span>
         </a>
         <a href="/login" className="font-semibold text-xs md:text-sm uppercase tracking-wider text-neutral-500 hover:text-black transition-colors">
            Sign In &rarr;
         </a>
      </nav>

      {/* --- Main Content --- */}
      <main className="relative max-w-7xl mx-auto min-h-[60vh] flex flex-col">
        
        {/* Search Header */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
           className="mb-12 md:mb-24 flex flex-col items-center md:items-end"
        >
           <h1 className="text-4xl md:text-7xl font-bold tracking-tight leading-none mb-6 md:mb-8 text-neutral-900 w-full text-center md:text-right">
              Track Parcel
           </h1>
           <form onSubmit={handleTrack} className="flex items-center border-b-2 sm:border-b-4 border-neutral-300 focus-within:border-black transition-colors w-full max-w-3xl ml-auto relative group">
              <div className="pl-2 md:pl-4 text-neutral-400">
                 <Search className="w-5 h-5 md:w-8 md:h-8" />
              </div>
              <input 
                 type="text" 
                 placeholder="Tracking Number"
                 required
                 value={trackingId}
                 onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                 className="w-full bg-transparent border-none text-xl md:text-4xl font-medium placeholder:text-neutral-300 py-4 md:py-8 px-4 md:px-6 focus:ring-0 outline-none uppercase"
              />
              <button 
                type="submit"
                disabled={loading}
                className="p-4 md:p-8 text-neutral-400 hover:text-black hover:translate-x-2 transition-all disabled:opacity-50"
              >
                 <ArrowRight className="w-6 h-6 md:w-10 md:h-10" strokeWidth={2.5} />
              </button>
           </form>
           {error && <p className="w-full text-center md:text-right text-red-500 font-medium text-xs md:text-sm mt-3 md:mt-4">{error}</p>}
        </motion.div>

        {/* --- Results Section --- */}
        <AnimatePresence mode="wait">
          {loading && (
             <motion.div 
               key="loading"
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="w-full flex justify-center py-12"
             >
                <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
             </motion.div>
          )}
          {shipmentData && !loading && (
            <motion.div 
               key="result"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.5, staggerChildren: 0.1 }}
               className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 mb-16 md:mb-24"
            >
              {/* Left Column: Status Overview */}
              <motion.div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6 md:gap-8">
                 <div className="p-6 md:p-8 bg-neutral-900 rounded-2xl border border-neutral-800 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Package size={120} /></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Parcel Telemetry</span>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4 text-white">
                       {shipmentData.status}
                    </h2>
                    
                    {shipmentData.status !== "Delivered" && (
                       <div className="mt-6 p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-3 shadow-inner">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Secure Pickup OTP</span>
                          <span className="text-4xl font-black tracking-[0.4em] text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.3)]">
                             {shipmentData.delivery_otp || "----"}
                          </span>
                          <p className="text-[9px] text-white/30 text-center leading-relaxed">Share this 4-digit code with your courier <br/> upon delivery to verify your identity.</p>
                       </div>
                    )}

                    {shipmentData.delivery_token && (
                       <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                             <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Crypto Verified</span>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-400/50 truncate max-w-[150px]">{shipmentData.delivery_token}</span>
                       </div>
                    )}

                    {shipmentData.status === "Delivered" && shipmentData.pod_photo && (
                       <div className="mt-6 space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Proof of Delivery Photo</span>
                          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                             <img src={`${process.env.NEXT_PUBLIC_API_URL}${shipmentData.pod_photo}`} alt="Delivery Proof" className="w-full h-auto object-cover max-h-64" />
                          </div>
                       </div>
                    )}

                    <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/10">
                       <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Estimated Drop-off</span>
                          <span className="text-xl font-bold">{shipmentData.estimated_delivery}</span>
                       </div>
                    </div>
                 </div>

                 {/* --- LIVE TRACKING MAP (Industry Standard Visual) --- */}
                 {shipmentData.status === "Out for Delivery" && (
                    <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm relative h-96 overflow-hidden flex flex-col">
                       <div className="mb-3 flex justify-between items-center px-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                             <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" /> Live Agent Tracking
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">8 mins away</span>
                       </div>
                       
                       <div className="relative flex-1 bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200 cursor-crosshair">
                          {/* Simulated SVG Map Background */}
                          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 200" fill="none">
                             <path d="M0 20H200M0 60H200M0 100H200M0 140H200M0 180H200" stroke="#000" strokeWidth="0.5" />
                             <path d="M20 0V200M60 0V200M100 0V200M140 0V200M180 0V200" stroke="#000" strokeWidth="0.5" />
                             <circle cx="100" cy="80" r="40" stroke="#000" strokeWidth="1" strokeDasharray="4 4" />
                          </svg>

                          {/* Customer Destination */}
                          <div className="absolute left-[80%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                             <div className="bg-black text-white p-2 rounded-lg shadow-lg mb-2 text-[8px] font-bold whitespace-nowrap">YOUR HOME</div>
                             <div className="w-4 h-4 bg-black rounded-full border-4 border-white shadow-xl" />
                          </div>

                          {/* Agent Movement Simulation */}
                          <motion.div 
                             animate={{ x: [0, 40, 80], y: [0, 20, 50] }}
                             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                             className="absolute left-[30%] top-[20%] z-10"
                          >
                             <div className="bg-indigo-600 text-white px-2 py-1 rounded-md shadow-lg mb-2 text-[8px] font-black whitespace-nowrap flex items-center gap-1.5">
                                <Truck size={8} /> {shipmentData.agent?.name || "COURIER"}
                             </div>
                             <div className="relative flex items-center justify-center">
                                <div className="absolute w-12 h-12 bg-indigo-500/20 rounded-full animate-ping" />
                                <div className="w-5 h-5 bg-indigo-600 rounded-full border-4 border-white shadow-2xl" />
                             </div>
                          </motion.div>
                       </div>
                    </div>
                 )}

                 <div className="p-6 md:p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 md:mb-6 block">Consignee Meta</span>
                    <div className="flex items-start gap-4">
                       <div className="p-2 md:p-3 bg-neutral-900 rounded-xl shrink-0 text-white">
                          <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                       </div>
                       <div>
                          <p className="text-lg md:text-xl font-black tracking-tight mb-1">{shipmentData.customer?.name || "Customer"}</p>
                          <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">{shipmentData.customer?.address || "Delivery Address"}</p>
                       </div>
                    </div>
                 </div>
              </motion.div>

              {/* Right Column: Timeline History */}
              <motion.div className="lg:col-span-12 xl:col-span-7 bg-white rounded-2xl border border-neutral-200 p-6 md:p-10 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-50 rounded-bl-full -z-10" />
                 <h3 className="text-lg md:text-xl font-black tracking-tight mb-8 text-neutral-900 border-b border-neutral-100 pb-4">Logistics Timeline</h3>
                 
                 <div className="relative pl-6 md:pl-8 border-l-2 border-neutral-100 space-y-8 md:space-y-10">
                    {shipmentData.timeline?.map((event, i) => (
                       <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i} 
                          className="relative group"
                       >
                          {/* Dot on line */}
                          <div className={`
                             absolute left-[-31px] md:left-[-37px] top-1 w-3 h-3 md:w-4 md:h-4 rounded-full ring-4 ring-white transition-all
                             ${i === 0 ? 'bg-black shadow-[0_0_0_2px_rgba(0,0,0,0.1)]' : 'bg-neutral-300'}
                          `} />
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 md:mb-2 gap-1 sm:gap-4">
                             <h4 className={`text-base md:text-lg font-semibold tracking-tight ${i === 0 ? 'text-black' : 'text-neutral-500'}`}>
                                {event.status}
                             </h4>
                             <span className="text-[10px] md:text-xs font-medium text-neutral-400 whitespace-nowrap">
                                {new Date(event.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                             </span>
                          </div>
                          <p className="text-sm text-neutral-500 leading-relaxed">
                             {event.message}
                          </p>
                       </motion.div>
                    ))}
                 </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* --- Footer Decoration --- */}
      <div className="mt-12 md:mt-24 pt-8 md:pt-12 border-t border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <span className="font-semibold text-lg tracking-tight text-neutral-300">SHIPNOVA LOGISTICS.</span>
         <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">2026 / TRACKING MODULE</span>
      </div>
    </div>
  );
}
