"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Package, MapPin, ChevronRight, Clock, AlertCircle, Loader2,
  TrendingUp, Box, User, Activity, ArrowRight, CheckCircle2,
  QrCode, ShieldCheck, Truck, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HubDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("floor"); // floor | incoming
  const [incomingShipments, setIncomingShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [hubId, setHubId] = useState(null);

  const fetchHubData = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const { data: hubs } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (hubs.length > 0) {
        setHubId(hubs[0]._id);
        const { data: hubDetails } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/${hubs[0]._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(hubDetails);
        // Fetch incoming requests
        const { data: incoming } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/${hubs[0]._id}/incoming`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIncomingShipments(incoming);
      }
    } catch (error) {
      console.error("Hub fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchHubData(); 
    const interval = setInterval(fetchHubData, 5000); // 5 sec live polling
    return () => clearInterval(interval);
  }, []);

  // Fetch QR for a shipment
  const fetchShipmentQR = async (trackingId) => {
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs/shipment-qr/${trackingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrData(data);
    } catch (err) {
      console.error("QR fetch failed:", err);
    }
  };

  // Verify and accept shipment
  const verifyShipment = async (trackingId) => {
    setVerifying(true);
    try {
      const token = localStorage.getItem("userToken");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/hubs/${hubId}/verify-shipment`, 
        { trackingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchHubData();
      setSelectedShipment(null);
      setQrData(null);
    } catch (err) {
      alert(err.response?.data?.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-red-600" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 flex flex-col items-center gap-4">
      <AlertCircle className="w-12 h-12 text-slate-200" />
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No Hub assigned.</p>
    </div>
  );

  const { hub, shipments } = data;
  const verifiedShipments = shipments.filter(s => s.status !== "Created" && s.status !== "Picked Up");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-red-600 font-black text-[10px] uppercase tracking-[0.4em]">
             <Activity className="size-4" /> Live Operation
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">
            {hub.name}
          </h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <MapPin className="size-4" /> {hub.location}
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-fit">
        {[
          { id: "floor", label: "Floor Inventory", count: verifiedShipments.length },
          { id: "incoming", label: "Incoming Requests", count: incomingShipments.length },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === tab.id 
                ? "bg-white text-slate-900 shadow-md" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                activeTab === tab.id ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-400"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total in Hub", val: shipments.length, icon: Box, color: "text-red-600" },
          { label: "Pending Verify", val: incomingShipments.length, icon: Clock, color: "text-amber-500" },
          { label: "Out for Delivery", val: shipments.filter(s => s.status === "Out for Delivery").length, icon: Truck, color: "text-blue-600" },
          { label: "Delivered", val: shipments.filter(s => s.status === "Delivered").length, icon: CheckCircle2, color: "text-emerald-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-3 hover:shadow-lg transition-all">
             <stat.icon className={`size-5 ${stat.color}`} />
             <div>
               <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{stat.label}</p>
               <h3 className="text-3xl font-black tracking-tighter text-slate-900">{stat.val}</h3>
             </div>
          </div>
        ))}
      </div>

      {/* INCOMING REQUESTS TAB */}
      {activeTab === "incoming" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">Awaiting Verification</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="size-3" /> Admin-assigned parcels
            </span>
          </div>

          {incomingShipments.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
              <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No pending requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {incomingShipments.map(s => (
                <motion.div 
                  key={s._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{s.trackingId}</span>
                      <h3 className="font-bold text-sm text-slate-900 mt-0.5">{s.customerName}</h3>
                    </div>
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider">{s.status}</span>
                  </div>
                  
                  <div className="flex items-start gap-2 mb-4 text-slate-400">
                    <MapPin className="size-3.5 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium leading-relaxed line-clamp-2">{s.address}</p>
                  </div>

                  {s.agent && (
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500">
                      <User className="size-3.5" />
                      <span>Agent: {s.agent.name}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-slate-50">
                    <button 
                      onClick={() => {
                        setSelectedShipment(s);
                        fetchShipmentQR(s.trackingId);
                      }}
                      className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <QrCode className="size-3.5" /> View QR
                    </button>
                    <button 
                      onClick={() => verifyShipment(s.trackingId)}
                      className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="size-3.5" /> Verify & Accept
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FLOOR INVENTORY TAB */}
      {activeTab === "floor" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight uppercase">Verified Inventory</h2>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Clock className="size-3" /> Real-time
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-black/10 rounded-xl p-4 bg-black/2">
              <p className="text-[10px] font-black uppercase tracking-wider text-black/45">Tip 1</p>
              <p className="text-sm font-bold text-black mt-1">Floor Inventory shows only parcels already accepted by Hub verification.</p>
            </div>
            <div className="border border-black/10 rounded-xl p-4 bg-black/2">
              <p className="text-[10px] font-black uppercase tracking-wider text-black/45">Tip 2</p>
              <p className="text-sm font-bold text-black mt-1">Use Agent Handover page to process inbound scans before expecting parcels here.</p>
            </div>
            <div className="border border-black/10 rounded-xl p-4 bg-black/2">
              <p className="text-[10px] font-black uppercase tracking-wider text-black/45">Tip 3</p>
              <p className="text-sm font-bold text-black mt-1">Use Hub Chat to coordinate discrepancies with Company Admin for this hub.</p>
            </div>
          </div>

          <div className="bg-white overflow-hidden border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="py-4 px-6">Tracking ID</th>
                  <th className="py-4 px-6">Recipient</th>
                  <th className="py-4 px-6">Agent</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {verifiedShipments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Package className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">No verified inventory</p>
                    </td>
                  </tr>
                ) : (
                  verifiedShipments.map((s) => (
                    <tr key={s._id} className="group hover:bg-slate-50 transition-all">
                      <td className="py-4 px-6 font-mono font-bold text-xs text-slate-400 uppercase tracking-wider group-hover:text-red-500 transition-colors">
                        {s.trackingId}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-sm text-slate-900">{s.customerName}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${s.agent ? 'text-slate-700' : 'text-slate-300'}`}>
                          <User className="size-3" /> {s.agent?.name || "Unassigned"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border ${
                          s.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          s.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => {
                            setSelectedShipment(s);
                            fetchShipmentQR(s.trackingId);
                          }}
                          className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                        >
                          <QrCode className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      <AnimatePresence>
        {selectedShipment && qrData && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setSelectedShipment(null); setQrData(null); }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-xl tracking-tight">Shipment QR Code</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{qrData.trackingId}</p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-wider ${
                  qrData.status === "At Sorting Facility" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}>
                  {qrData.status}
                </span>
              </div>

              {/* QR Code Display */}
              <div className="flex justify-center p-6 bg-white border-2 border-slate-100 rounded-2xl">
                <img src={qrData.qrCode} alt="Shipment QR" className="w-64 h-64" />
              </div>

              {/* Shipment Details */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Customer</span>
                  <span className="text-slate-900 font-bold">{qrData.customerName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Address</span>
                  <span className="text-slate-900 font-bold text-right max-w-50">{qrData.address}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Signature</span>
                  <span className="text-red-600 font-mono font-bold text-[10px]">{qrData.signature}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setSelectedShipment(null); setQrData(null); }}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Print Label
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
