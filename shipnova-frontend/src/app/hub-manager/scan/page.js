"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Scan, ShieldCheck, Box, AlertCircle, CheckCircle2,
  Loader2, Package, QrCode, Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QrScannerModal from "@/components/QrScannerModal";

export default function HandoverScan() {
  const [hubId, setHubId] = useState(null);
  const [hubInfo, setHubInfo] = useState(null);
  const [hubQR, setHubQR] = useState(null);
  const [trackingId, setTrackingId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [showVerified, setShowVerified] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    const fetchHub = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const { data: hubs } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (hubs.length > 0) {
          setHubId(hubs[0]._id);
          setHubInfo(hubs[0]);
          const { data: qr } = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/hubs/${hubs[0]._id}/qr`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setHubQR(qr);
        }
      } catch (err) {
        console.error("Hub fetch error:", err);
      }
    };
    fetchHub();
  }, []);

  const doVerify = async (tid) => {
    const upper = tid.trim().toUpperCase();
    if (!upper || !hubId) return;
    setProcessing(true);
    setError(null);
    setInfo(null);
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/hubs/${hubId}/verify-shipment`,
        { trackingId: upper },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowVerified(data);
      setActivityLog((prev) => [
        {
          id: upper,
          time: new Date().toLocaleTimeString(),
          status: "VERIFIED",
          hash: data.verificationHash,
          customer: data.shipment?.customerName,
        },
        ...prev,
      ]);
      setTrackingId("");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Check tracking ID.");
    } finally {
      setProcessing(false);
    }
  };

  const parseScannedValue = (decodedText) => {
    try {
      const payload = JSON.parse(decodedText);

      if (payload?.type === "SHIPMENT_LABEL" && payload?.trackingId) {
        return { kind: "shipment", value: payload.trackingId };
      }

      if (payload?.type === "HUB_VERIFICATION") {
        return { kind: "hub", value: payload.hubCode || "" };
      }

      if (payload?.trackingId) {
        return { kind: "shipment", value: payload.trackingId };
      }

      return { kind: "raw", value: decodedText };
    } catch {
      return { kind: "raw", value: decodedText };
    }
  };

  // Called by QrScannerModal
  const handleScan = (decodedText) => {
    setScannerOpen(false);
    const parsed = parseScannedValue(decodedText);

    if (parsed.kind === "hub") {
      setInfo("You scanned a Hub QR. On this page, scan the shipment label QR or enter tracking ID.");
      return;
    }

    const tid = parsed.value;
    setTrackingId(tid.toUpperCase());
    doVerify(tid);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">

      {/* Camera Scanner Modal */}
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScan}
        title="Scan Shipment QR"
        hint="Point at the parcel barcode / QR to accept into facility"
      />

      {/* Verified Fullscreen Flash */}
      <AnimatePresence>
        {showVerified && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-emerald-600 z-100 flex flex-col items-center justify-center p-10 text-white"
          >
            <motion.div
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="size-32 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-2xl mb-8"
            >
              <ShieldCheck className="size-16" />
            </motion.div>
            <h2 className="text-4xl font-black tracking-tight mb-2">Parcel Verified</h2>
            <p className="text-emerald-200 font-bold text-sm mb-8">
              {showVerified.shipment?.trackingId} accepted into facility
            </p>
            <div className="bg-black/10 rounded-2xl p-6 w-full max-w-sm space-y-3">
              <div className="flex justify-between text-xs">
                <span className="opacity-60">Customer</span>
                <span className="font-bold">{showVerified.shipment?.customerName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-60">Hash</span>
                <span className="font-mono font-bold text-[10px]">{showVerified.verificationHash}</span>
              </div>
            </div>
            <button
              onClick={() => setShowVerified(null)}
              className="mt-8 bg-white text-emerald-600 font-black uppercase tracking-widest px-10 py-4 rounded-2xl text-xs hover:scale-105 transition-all"
            >
              Continue Scanning →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-3 text-red-600 font-black text-[10px] uppercase tracking-[0.3em]">
            <Scan className="size-4" /> Verification Terminal
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Inbound Scanner</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">
            Verify physical parcels arriving at {hubInfo?.name || "the hub"}
          </p>
        </div>
      </div>

      {/* First-time guide */}
      <div className="bg-white border-2 border-black/10 rounded-2xl p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/45 mb-3">First Time Guide</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border border-black/10 rounded-xl p-3 bg-black/2">
            <p className="text-[10px] font-black uppercase tracking-wider text-black/45">Step 1</p>
            <p className="text-sm font-bold text-black mt-1">Use this page to scan Shipment QR labels only.</p>
          </div>
          <div className="border border-black/10 rounded-xl p-3 bg-black/2">
            <p className="text-[10px] font-black uppercase tracking-wider text-black/45">Step 2</p>
            <p className="text-sm font-bold text-black mt-1">Hub QR is for agents during pickup check-in, not for inbound verification.</p>
          </div>
          <div className="border border-black/10 rounded-xl p-3 bg-black/2">
            <p className="text-[10px] font-black uppercase tracking-wider text-black/45">Step 3</p>
            <p className="text-sm font-bold text-black mt-1">After scan, status moves to <span className="text-emerald-700">At Sorting Facility</span>.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Scanner Input */}
        <div className="lg:col-span-7 space-y-6">

          {/* Camera Scan Button */}
          <button
            onClick={() => setScannerOpen(true)}
            className="w-full py-5 bg-red-600 text-white rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-lg shadow-red-100 hover:bg-red-700 active:scale-[0.98] transition-all"
          >
            <Camera className="w-5 h-5" /> Scan with Camera
          </button>

          <div className="flex items-center gap-4 py-1">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">or type manually</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Manual Form */}
          <form onSubmit={(e) => { e.preventDefault(); doVerify(trackingId); }} className="relative">
            <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-600 rounded-2xl text-white">
                  <Scan className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-black uppercase tracking-wider block text-slate-900">
                    Inbound Verification
                  </span>
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                    Scan or enter tracking ID
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Tracking ID
                </label>
                <input
                  autoFocus
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  placeholder="SN-XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-2xl font-black text-slate-900 placeholder:text-slate-200 outline-none focus:border-red-600 focus:bg-white transition-all font-mono tracking-widest text-center"
                />
                <p className="text-[9px] text-slate-400 text-center font-medium">
                  💡 USB barcode scanners auto-fire into this field
                </p>
              </div>

              <button
                disabled={processing || !trackingId}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                  processing
                    ? "bg-slate-100 text-slate-300 animate-pulse"
                    : "bg-slate-900 hover:bg-red-600 text-white"
                }`}
              >
                {processing
                  ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  : "Verify & Accept into Facility"
                }
              </button>

              {error && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-center"
                >
                  <AlertCircle className="size-5 text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-600">{error}</p>
                </motion.div>
              )}

              {info && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-center"
                >
                  <AlertCircle className="size-5 text-blue-600 shrink-0" />
                  <p className="text-xs font-bold text-blue-700">{info}</p>
                </motion.div>
              )}
            </div>
          </form>

          {/* Hub QR Code */}
          {hubQR && (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm tracking-tight">Hub Identity QR</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Agents scan this to check-in to your hub
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-3 py-1 rounded-md">
                  {hubQR.hubCode}
                </span>
              </div>
              <div className="flex justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <img src={hubQR.qrCode} alt="Hub QR" className="w-48 h-48" />
              </div>
              <p className="text-[9px] text-slate-400 text-center font-medium italic">
                Print and display at hub entrance · Agents scan on their phone to verify location
              </p>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Live Verification Log
          </h3>
          <div className="space-y-3 max-h-150 overflow-y-auto pr-1">
            {activityLog.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-100 rounded-2xl p-12 flex flex-col items-center text-center opacity-40">
                <Package className="size-10 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Waiting for scans
                </p>
              </div>
            ) : (
              activityLog.map((log, i) => (
                <motion.div
                  key={`${log.id}-${i}`}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-white border border-emerald-50 rounded-2xl p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div>
                        <p className="font-mono font-black text-sm text-slate-900 tracking-wider">{log.id}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.time}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
                      {log.status}
                    </span>
                  </div>
                  {log.customer && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold">Customer</span>
                      <span className="text-slate-700 font-bold">{log.customer}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400 font-bold">HMAC</span>
                    <span className="text-red-600 font-mono font-bold text-[9px] truncate ml-4 max-w-35">{log.hash}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
