"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, MapPin, CheckCircle2, Navigation, LogOut, Loader2,
  Camera, Edit3, User, ScanLine, Phone, RefreshCcw, ShieldCheck,
  Building2, AlertCircle, ArrowRight,
} from "lucide-react";
import QrScannerModal from "@/components/QrScannerModal";

export default function AgentMobileApp() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("delivery");

  // ── Modals State ────────────────────────────────────────────────────────────
  
  // 0. Batch Scanner Mode
  const [batchMode, setBatchMode] = useState(false);
  const [scannedTrackingIds, setScannedTrackingIds] = useState([]);

  // 1. Pickup From Hub Modal
  const [pickupModal, setPickupModal] = useState({ open: false, shipment: null, step: 1 });
  const [hubInput, setHubInput] = useState("");
  const [verifiedHub, setVerifiedHub] = useState(null);
  const [pickupPhoto, setPickupPhoto] = useState(null);
  const [pickupUploading, setPickupUploading] = useState(false);

  // 2. Drop Off POD Modal
  const [podModal, setPodModal] = useState({ open: false, shipment: null });
  const [podNote, setPodNote] = useState("");
  const [podOTP, setPodOTP] = useState("");
  const [podPhoto, setPodPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 3. QR Scanner
  const [qrScanner, setQrScanner] = useState({ open: false, mode: null }); // "hub"

  const getGPS = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { timeout: 5000 }
      );
    });

  const fetchShipments = async (bg = false) => {
    if (!bg) setLoading(true);
    else setSyncing(true);
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/shipments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShipments(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      if (!bg) setLoading(false);
      else setTimeout(() => setSyncing(false), 500);
    }
  };

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) { router.push("/login"); return; }
    try {
      const parsed = JSON.parse(userInfo);
      if (parsed.role !== "Agent") throw new Error("Not an agent");
      setUser(parsed);
      fetchShipments();
      const interval = setInterval(() => fetchShipments(true), 15000);
      return () => clearInterval(interval);
    } catch { router.push("/login"); }
  }, [router]);

  // ── Generic File Upload ─────────────────────────────────────────────────────
  const uploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/pod`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      return data.imageUrl;
    } catch { return null; }
  };

  // ── PHASE A: PICKUP FLOW ────────────────────────────────────────────────────
  
  const handleQrScan = async (decodedText) => {
    const currentMode = qrScanner.mode;
    setQrScanner({ open: false, mode: null });
    try {
      let payload;
      try { payload = JSON.parse(decodedText); }
      catch { payload = { raw: decodedText }; }
      
      const hubCode = payload.hubCode || payload.raw || decodedText;
      
      if (currentMode === "hub-batch") {
         await verifyAndLoadBatch(hubCode.toUpperCase());
      } else {
         verifyHubCode(hubCode.toUpperCase());
      }
    } catch (e) { console.error("QR parse error:", e); }
  };

  const verifyAndLoadBatch = async (hubCode) => {
    try {
      const token = localStorage.getItem("userToken");
      
      // Get all active shipments that aren't Out for Delivery yet
      const pendingIds = shipments.filter(s => s.status !== "Out for Delivery" && s.status !== "Delivered" && s.status !== "Failed / Retry / Returned").map(s => s.trackingId);
      
      if (pendingIds.length === 0) return alert("No packages to load.");

      // 1. Secure Authorized Bulk push
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/shipments/bulk/status`,
        { trackingIds: pendingIds, status: "Out for Delivery", message: "Batch loading verified via Hub Handshake", hubCode: hubCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Fetch driver coordinates globally
      const { lat, lng } = await getGPS();

      // 3. Trigger Route Optimizer globally
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/shipments/optimize-route`,
        { currentLat: lat, currentLng: lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Handshake Confirmed! Packages loaded securely and Route Optimized.");
      setShipments(response.data.route);
    } catch (e) {
      alert(`Handshake Failed: ${e.response?.data?.message || "Invalid Hub Code or API Error."}`);
    }
  };

  const verifyHubCode = async (code) => {
    setPickupUploading(true);
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/shipments/verify-hub`,
        { hubCode: code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVerifiedHub(data);
      setPickupModal(prev => ({ ...prev, step: 2 }));
    } catch (err) {
      alert(`Hub verification failed: ${err.response?.data?.message || "Invalid code."}`);
    } finally {
      setPickupUploading(false);
    }
  };

  const submitPickup = async (e) => {
    e.preventDefault();
    if (!pickupPhoto) return alert("Please capture a proof of pickup photo.");
    setPickupUploading(true);
    
    let imageUrl = await uploadPhoto(pickupPhoto);
    if (!imageUrl) {
      alert("Failed to upload pickup image. Try again.");
      setPickupUploading(false);
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/shipments/bulk/status`,
        {
          trackingIds: [pickupModal.shipment.trackingId],
          status: "Out for Delivery",
          hubId: verifiedHub.hubId,
          message: `Picked up from ${verifiedHub.hubName} by agent`,
          proofOfPickup: imageUrl
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Reset flow & Refresh
      setPickupModal({ open: false, shipment: null, step: 1 });
      setVerifiedHub(null);
      setPickupPhoto(null);
      setHubInput("");
      fetchShipments(true);
    } catch (err) {
      alert(`Pickup failed: ${err.response?.data?.message || "Please retry."}`);
    } finally {
      setPickupUploading(false);
    }
  };

  const closePickupModal = () => {
    setPickupModal({ open: false, shipment: null, step: 1 });
    setVerifiedHub(null);
    setPickupPhoto(null);
    setHubInput("");
  };

  // ── PHASE B: DROP-OFF FLOW ──────────────────────────────────────────────────
  
  const completeDelivery = async (shipmentId, podData) => {
    try {
      const token = localStorage.getItem("userToken");
      const { lat, lng } = await getGPS();
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/shipments/${shipmentId}/status`,
        {
          status: "Delivered",
          message: `Delivered. ${podData.note || ""}`,
          lat, lng,
          otp: podData.otp,
          proofOfDelivery: podData.imageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchShipments(true);
      setPodModal({ open: false, shipment: null });
      setPodNote(""); setPodOTP(""); setPodPhoto(null);
    } catch (error) {
      alert(`Failed: ${error.response?.data?.message || "Check connection."}`);
    }
  };

  const submitPOD = async (e) => {
    e.preventDefault();
    if (!podOTP || podOTP.length !== 4) return alert("Enter 4-digit Customer OTP.");
    if (!podPhoto) return alert("Capture a Proof of Delivery photo.");
    setUploading(true);
    let imageUrl = await uploadPhoto(podPhoto);
    if (imageUrl) {
      await completeDelivery(podModal.shipment._id, { note: podNote, otp: podOTP, imageUrl });
    } else {
      alert("Failed to upload delivery photo.");
    }
    setUploading(false);
  };

  const markFailed = async (id) => {
    if (!confirm("Flag delivery as Failed/Returned?")) return;
    try {
      const token = localStorage.getItem("userToken");
      const { lat, lng } = await getGPS();
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/shipments/${id}/status`,
        { status: "Failed / Retry / Returned", message: "Delivery failed — flagged by agent", lat, lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchShipments(true);
    } catch (err) { alert("Failed to update."); }
  };

  if (!user || loading) return (
    <div className="flex bg-white h-dvh w-full items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
    </div>
  );

  const active = shipments.filter((s) => s.status !== "Delivered" && s.status !== "Failed / Retry / Returned");
  const delivered = shipments.filter((s) => s.status === "Delivered");
  const failed = shipments.filter((s) => s.status === "Failed / Retry / Returned");

  return (
    <div className="bg-[#f9fafb] text-neutral-900 min-h-dvh w-full flex flex-col font-sans">
      <QrScannerModal
        isOpen={qrScanner.open}
        onClose={() => setQrScanner({ open: false, mode: null })}
        onScanSuccess={handleQrScan}
        title="Scan Hub QR"
        hint="Scan the Hub QR code to authenticate"
      />

      {/* Header */}
      <header className="px-5 py-3.5 border-b border-neutral-200 flex justify-between items-center bg-white sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-4 ring-indigo-50">
            {user.name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-sm leading-tight block">{user.name}</span>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
              {syncing ? "Syncing..." : "Field Agent"}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => fetchShipments()} className="p-2 hover:bg-neutral-50 rounded-full">
            <RefreshCcw className={`w-4 h-4 text-neutral-400 ${syncing ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="p-2 hover:bg-red-50 rounded-full text-red-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">

        {/* ── Active Deliveries Tab ── */}
        {activeTab === "delivery" && (
          <section className="space-y-4">
            <div className="flex justify-between items-end px-1 mb-2">
              <div>
                <h2 className="font-black text-2xl tracking-tight">Active Route</h2>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                  {active.filter(s => s.status === "Out for Delivery").length} Out for Delivery · {active.filter(s => s.status !== "Out for Delivery").length} Pending Pickup
                </p>
              </div>
            </div>

            {/* BATCH LOADING FEATURE 2: Strict Handshake */}
            {active.some(s => s.status !== "Out for Delivery") && (
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-[32px] shadow-xl shadow-indigo-600/20 mb-6 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md shadow-inner">
                     <Package className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                  <h3 className="font-black text-xl tracking-tight mb-1.5 drop-shadow-sm">Ready to hit the road?</h3>
                  <p className="text-[11px] font-medium text-indigo-100/90 leading-relaxed mb-6 px-2">
                    Start your shift by scanning the Hub QR to securely transfer custody and auto-optimize your route.
                  </p>
                  <button
                    onClick={() => {
                      if(!confirm("Start Shift: To load pending deliveries onto your truck, you must scan the Hub Authorization QR.")) return;
                      setBatchMode(true);
                      setQrScanner({ open: true, mode: "hub-batch" });
                    }}
                    className="bg-white text-indigo-700 w-full py-4 rounded-[20px] font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex justify-center items-center gap-2"
                  >
                    Scan QR & Load Truck <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {/* Background Decoration */}
                <Package className="absolute -bottom-6 -right-6 w-40 h-40 text-indigo-800 opacity-30 -rotate-12 pointer-events-none" />
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-white rounded-full opacity-5 blur-3xl pointer-events-none" />
              </div>
            )}

            {active.length === 0 ? (
              <div className="py-20 flex flex-col items-center opacity-40">
                <CheckCircle2 className="w-16 h-16 mb-4 text-neutral-300" />
                <p className="text-xs font-bold uppercase tracking-widest">Route Complete</p>
              </div>
            ) : (
              active.map((s) => (
                <div key={s._id} className="bg-white border text-left border-neutral-200 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${s.status === "Out for Delivery" ? "bg-amber-400" : "bg-blue-400"}`} />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono bg-neutral-100 px-2 py-0.5 rounded-md">{s.trackingId}</span>
                      <h3 className="font-black text-lg mt-1 tracking-tight">{s.customerName}</h3>
                    </div>
                    {s.status === "Out for Delivery" ? (
                       <span className="text-[8px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wider">
                         <Navigation className="w-3 h-3" /> En Route
                       </span>
                    ) : (
                       <span className="text-[8px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wider">
                         <Building2 className="w-3 h-3" /> At Hub
                       </span>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-2.5 mb-5 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div>
                       <p className="text-xs font-semibold text-neutral-700 leading-relaxed">{s.address}</p>
                       {s.phoneNumber && (
                          <a href={`tel:${s.phoneNumber}`} className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 mt-1.5 hover:underline w-fit">
                            <Phone className="w-3 h-3" /> Call {s.phoneNumber}
                          </a>
                        )}
                    </div>
                  </div>

                  {/* ── DYNAMIC ACTION BUTTON ── */}
                  <div className="flex gap-2">
                    {s.status !== "Out for Delivery" ? (
                      <button
                        onClick={() => setPickupModal({ open: true, shipment: s, step: 1 })}
                        className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-blue-600/20"
                      >
                        <Package className="w-4 h-4" /> Pick Up From Hub
                      </button>
                    ) : (
                      <button
                        onClick={() => setPodModal({ open: true, shipment: s })}
                        className="flex-1 bg-neutral-900 text-white py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-black/20"
                      >
                        <Navigation className="w-4 h-4" /> Drop Off
                      </button>
                    )}
                    
                    <button
                      onClick={() => markFailed(s._id)}
                      className="px-4 py-3.5 border-2 border-red-100 text-red-500 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                    >
                      Fail
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* ── History Tab ── */}
        {activeTab === "history" && (
          <section className="space-y-4">
            <h2 className="font-black text-2xl tracking-tight px-1 mb-4">Completed</h2>
            {delivered.length === 0 ? (
              <div className="py-20 flex flex-col items-center opacity-40">
                <Package className="w-16 h-16 mb-4 text-neutral-300" />
                <p className="text-xs font-bold uppercase tracking-widest">No deliveries yet</p>
              </div>
            ) : (
              delivered.map((s) => (
                <div key={s._id} className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                    </span>
                    <span className="text-[9px] font-mono font-bold text-neutral-400">{s.trackingId}</span>
                  </div>
                  <h3 className="font-bold text-sm tracking-tight">{s.customerName}</h3>
                  <div className="flex items-start gap-2 text-neutral-500 mt-1">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-medium">{s.address}</p>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
           // Profile layout logic from before
           <section className="space-y-6 pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-black text-white ring-8 ring-indigo-50">
                {user?.name?.charAt(0)}
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black tracking-tight mb-1">{user?.name}</h2>
                <span className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{user?.email}</span>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-neutral-100 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-20">
        <div className="flex justify-around items-center h-16 px-6">
          {[
            { id: "delivery", icon: Package, label: "Routes" },
            { id: "history", icon: CheckCircle2, label: "Done" },
            { id: "profile", icon: User, label: "Me" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-16 flex-col items-center gap-1 transition-colors ${activeTab === tab.id ? "text-indigo-600" : "text-neutral-400"}`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "fill-indigo-50" : ""}`} />
              <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── PHASE A MODAL: PICKUP ── */}
      <AnimatePresence>
        {pickupModal.open && (
           <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closePickupModal} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
             <motion.div
               initial={{ y: "100%", opacity:0 }} animate={{ y: 0, opacity:1 }} exit={{ y: "100%", opacity:0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="bg-white w-full sm:max-w-md rounded-[32px] shadow-2xl overflow-hidden relative z-10"
             >
                <div className="p-6">
                   <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6" />
                   
                   <div className="mb-6">
                     <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">
                        {pickupModal.step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
                     </span>
                     <h2 className="text-2xl font-black tracking-tight mt-2">Pick Up Parcel</h2>
                     <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">
                        {pickupModal.shipment?.trackingId}
                     </p>
                   </div>

                   {pickupModal.step === 1 && (
                     <div className="space-y-4">
                        <p className="text-sm font-medium text-neutral-600 leading-relaxed mb-4">
                           You are picking up this parcel. Prove you are at the Hub by scanning the authentication QR.
                        </p>
                        
                        <button
                          onClick={() => setQrScanner({ open: true, mode: "hub" })}
                          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                          <ScanLine className="w-5 h-5" /> Scan Hub QR
                        </button>
                        
                        <div className="relative flex items-center py-4">
                           <div className="flex-grow border-t border-neutral-200" />
                           <span className="shrink-0 px-4 text-[10px] font-bold text-neutral-300 uppercase tracking-widest">OR ENTER MANUALLY</span>
                           <div className="flex-grow border-t border-neutral-200" />
                        </div>
                        
                        <div className="flex gap-2">
                           <input
                              type="text"
                              maxLength={12}
                              placeholder="HUB CODE"
                              value={hubInput}
                              onChange={(e) => setHubInput(e.target.value.toUpperCase())}
                              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 font-mono font-black tracking-widest outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                           />
                           <button
                             onClick={() => verifyHubCode(hubInput)}
                             disabled={hubInput.length < 3 || pickupUploading}
                             className="bg-neutral-900 text-white px-6 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-40"
                           >
                              {pickupUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                           </button>
                        </div>
                     </div>
                   )}

                   {pickupModal.step === 2 && (
                     <form onSubmit={submitPickup} className="space-y-5">
                       <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-xs font-black text-emerald-800 tracking-tight">Verified at {verifiedHub?.hubName}</p>
                            <p className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-widest mt-0.5">Now attach a photo of the parcel</p>
                          </div>
                       </div>
                       
                       <div className="relative h-48 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-[24px] flex items-center justify-center overflow-hidden hover:bg-neutral-100 transition-colors">
                         {pickupPhoto ? (
                           <>
                             <img src={URL.createObjectURL(pickupPhoto)} className="w-full h-full object-cover" alt="Pickup Proof" />
                             <button type="button" onClick={() => setPickupPhoto(null)} className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full text-white shadow-lg">
                               <Edit3 className="w-4 h-4" />
                             </button>
                           </>
                         ) : (
                           <label className="cursor-pointer flex flex-col items-center justify-center gap-2 w-full h-full">
                             <div className="bg-white p-3 rounded-full shadow-sm mb-1"><Camera className="w-6 h-6 text-neutral-400" /></div>
                             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tap to snap proof photo</span>
                             <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPickupPhoto(e.target.files?.[0])} />
                           </label>
                         )}
                       </div>
                       
                       <button
                         type="submit"
                         disabled={pickupUploading || !pickupPhoto}
                         className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-transform"
                       >
                         {pickupUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm Pickup <ArrowRight className="w-4 h-4" /></>}
                       </button>
                     </form>
                   )}
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* ── PHASE B MODAL: DROP-OFF (Existing POD) ── */}
      <AnimatePresence>
        {podModal.open && (
           <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setPodModal({open: false, shipment: null})} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
             <motion.div
               initial={{ y: "100%", opacity:0 }} animate={{ y: 0, opacity:1 }} exit={{ y: "100%", opacity:0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="bg-white w-full sm:max-w-md rounded-[32px] shadow-2xl overflow-hidden relative z-10"
             >
              <div className="p-6 space-y-5">
                <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-2" />

                <div>
                  <h2 className="text-2xl font-black tracking-tight">Complete Delivery</h2>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                    {podModal.shipment?.trackingId} → {podModal.shipment?.customerName}
                  </p>
                </div>

                {/* Secure Customer Auth Box */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-black text-xs text-amber-900 tracking-tight">Customer Verification Required</h4>
                    <p className="text-[10px] font-bold text-amber-700/80 leading-relaxed mt-1">
                      Ask the customer for the 4-digit OTP sent to their email when you left the hub.
                    </p>
                  </div>
                </div>

                <form onSubmit={submitPOD} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">
                      1. Enter Customer OTP
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength="4"
                      placeholder="0 0 0 0"
                      className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-[20px] py-4 text-center text-4xl font-black tracking-[0.5em] focus:border-amber-400 focus:bg-white outline-none transition-all placeholder:text-neutral-200"
                      value={podOTP}
                      onChange={(e) => setPodOTP(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">
                      2. Capture Proof of Delivery
                    </label>
                    <div className="relative h-32 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-[20px] flex items-center justify-center overflow-hidden hover:bg-neutral-100 transition-colors">
                      {podPhoto ? (
                        <>
                          <img src={URL.createObjectURL(podPhoto)} className="w-full h-full object-cover" alt="POD" />
                          <button type="button" onClick={() => setPodPhoto(null)} className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full text-white">
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5 w-full h-full">
                          <div className="bg-white p-2 rounded-full shadow-sm mb-1"><Camera className="w-5 h-5 text-neutral-400" /></div>
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Snap context photo</span>
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPodPhoto(e.target.files?.[0])} />
                        </label>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading || podOTP.length !== 4 || !podPhoto}
                    className="w-full bg-neutral-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-transform"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm & Deliver"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
