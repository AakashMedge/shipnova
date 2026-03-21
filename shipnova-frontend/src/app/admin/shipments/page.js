"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Search, MapPin, Loader2, CheckCircle2,
  Mail, Phone, Package, X, ChevronRight,
  User, Building2, AlertTriangle, Scan, Image as ImageIcon,
  Clock, ShieldCheck, ShieldX, ExternalLink, History, Eye, Edit3, Settings, AlertCircle, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL;
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// ─── Status helpers ───────────────────────────────────────────────────────────
const getStatusBadge = (status) => {
  switch (status) {
    case "In Transit":           return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "Delivered":            return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Created":
    case "Picked Up":
    case "At Sorting Facility":  return "bg-blue-50 text-blue-700 border-blue-200";
    case "Out for Delivery":     return "bg-amber-50 text-amber-700 border-amber-200";
    case "Failed / Retry / Returned": return "bg-red-50 text-red-700 border-red-200";
    default:                     return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const STATUS_ICONS = {
  "Created":               "📦",
  "Picked Up":             "🙌",
  "At Sorting Facility":   "🏭",
  "In Transit":            "🚛",
  "Out for Delivery":      "🛵",
  "Delivered":             "✅",
  "Failed / Retry / Returned": "⚠️",
};

// ─── Timeline / Event Component ───────────────────────────────────────────────
function EventTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 text-sm font-bold">
        No tracking events yet.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100" />

      <div className="space-y-5">
        {events.map((event, i) => {
          const isLast = i === events.length - 1;
          return (
            <div key={i} className="relative flex gap-4 pl-10">
              {/* Dot */}
              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm z-10
                ${isLast
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-white border-2 border-slate-200"
                }`}
              >
                {STATUS_ICONS[event.status] || "📍"}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border
                    ${getStatusBadge(event.status)}`}
                  >
                    {event.status}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(event.time || event.createdAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
                {event.message && (
                  <p className="text-xs font-medium text-slate-600 mt-1.5 leading-relaxed">{event.message}</p>
                )}
                {event.updatedBy && (
                  <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                    <User className="w-2.5 h-2.5" />
                    {event.updatedBy} · {event.updatedByRole || "agent"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Full Detail Modal ────────────────────────────────────────────────────────
function ShipmentDetailModal({ shipmentId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [podOpen, setPodOpen] = useState(false);
  const [popOpen, setPopOpen] = useState(false);

  useEffect(() => {
    if (!shipmentId) return;
    const fetch = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const { data: s } = await axios.get(`${API}/shipments/${shipmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(s);
      } catch (e) {
        console.error("Failed to load shipment detail:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [shipmentId]);

  // Build timeline from embedded history array (richest source)
  const timeline = data?.history?.length
    ? [...data.history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((h) => ({
        status: h.status,
        message: h.message,
        time: h.timestamp,
        updatedBy: h.updatedBy?.name || "System",
        updatedByRole: h.updatedBy?.role || "",
      }))
    : [];

  const podUrl = data?.proofOfDelivery ? `${BACKEND}${data.proofOfDelivery}` : null;
  const popUrl = data?.proofOfPickup ? `${BACKEND}${data.proofOfPickup}` : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[28px] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Shipment Detail</h2>
            {data && (
              <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                {data.trackingId}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : !data ? (
            <div className="py-20 text-center text-slate-400 font-bold">Failed to load shipment data.</div>
          ) : (
            <div className="p-8 space-y-8">

              {/* ── Info Grid ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer */}
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Recipient</p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 text-white font-black shadow-md">
                      {data.customerName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{data.customerName}</p>
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" /> {data.customerEmail}
                      </p>
                      {data.phoneNumber && (
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {data.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Package & Agent */}
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Package & Agent</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">
                        {data.packageDetails || "No description"}
                      </p>
                    </div>
                    {data.agent && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <User className="w-3 h-3" />
                        Agent: <span className="text-slate-700">{data.agent.name}</span>
                      </div>
                    )}
                    {data.hub && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Building2 className="w-3 h-3" />
                        Hub: <span className="text-slate-700">{data.hub.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Status */}
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Delivery Status</p>
                  <div className="space-y-2">
                    <span className={`inline-block px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${getStatusBadge(data.status)}`}>
                      {data.status}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      {data.otpVerified ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <ShieldCheck className="w-3.5 h-3.5" /> OTP Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400">
                          <ShieldX className="w-3.5 h-3.5" /> OTP Pending
                        </span>
                      )}
                    </div>
                    {data.deliveryToken && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2">
                        <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Delivery Token</p>
                        <p className="text-[9px] font-mono font-bold text-emerald-800 break-all mt-0.5">
                          {data.deliveryToken}
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{data.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Proof of Pickup Photo (Hub) ── */}
              {popUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                      Proof of Hub Pickup — Uploaded by Agent
                    </h3>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    {popOpen ? (
                      <img
                        src={popUrl}
                        alt="Proof of Pickup"
                        className="w-full max-h-96 object-contain"
                      />
                    ) : (
                      <div className="relative border-4 border-slate-100 rounded-2xl overflow-hidden">
                        <img
                          src={popUrl}
                          alt="Proof of Pickup"
                          className="w-full h-48 object-cover filter blur-sm grayscale opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <button
                            onClick={() => setPopOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-black text-xs shadow-xl shadow-indigo-200 hover:scale-105 transition-transform"
                          >
                            <Eye className="w-4 h-4" /> Verify Hub Pickup
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Building2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Acquired from Hub Facility
                        </span>
                      </div>
                      <a href={popUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
                        Open Original <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Proof of Delivery Photo ── */}
              {podUrl && (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                      Proof of Delivery — Uploaded by Agent
                    </h3>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    {podOpen ? (
                      <img
                        src={podUrl}
                        alt="Proof of Delivery"
                        className="w-full max-h-96 object-contain"
                      />
                    ) : (
                      <div className="relative">
                        <img
                          src={podUrl}
                          alt="Proof of Delivery"
                          className="w-full h-48 object-cover filter blur-sm"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <button
                            onClick={() => setPodOpen(true)}
                            className="flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-full font-black text-xs shadow-xl hover:scale-105 transition-transform"
                          >
                            <Eye className="w-4 h-4" /> View Photo
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Photo uploaded at time of delivery
                        </span>
                      </div>
                      <a
                        href={podUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Full
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Event Timeline ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                    Full Tracking Timeline ({timeline.length} events)
                  </h3>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5">
                  {timeline.length > 0 ? (
                    <EventTimeline events={timeline} />
                  ) : (
                    <p className="text-sm text-slate-400 font-bold text-center py-4">
                      No event history available. Updates will appear here.
                    </p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal Field Component ────────────────────────────────────────────────────
function ModalField({ id, label, icon: Icon, type = "text", value, onChange, placeholder, error }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-slate-900 font-bold text-sm outline-none transition-all placeholder:text-slate-300
          ${error ? "border-red-300 bg-red-50 focus:border-red-500" : "border-slate-200 focus:border-indigo-600 focus:bg-white"}`}
      />
      {error && <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

// ─── Shipment Row ─────────────────────────────────────────────────────────────
function ShipmentRow({ shipment, agents, hubs, assigningId, assigningHubId, onAssignAgent, onAssignHub, onPrintLabel, onViewDetail, onEdit }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={`group transition-all cursor-pointer border-l-4 ${expanded ? "border-l-black bg-black/2" : "border-l-transparent hover:bg-black/2 hover:border-l-black/25"}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={`transition-transform duration-200 text-slate-300 ${expanded ? "rotate-90" : ""}`}>
              <ChevronRight className="w-4 h-4" />
            </div>
            <span className="font-black font-mono text-sm text-slate-900 tracking-widest">{shipment.trackingId}</span>
          </div>
        </td>
        <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-0.5">
            <span className="font-black text-slate-900 text-sm">{shipment.customerName}</span>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Mail className="w-3 h-3" /> {shipment.customerEmail}
            </span>
          </div>
        </td>
        <td className="px-6 py-5 text-sm text-slate-400 font-bold" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 max-w-45">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-300" />
            <span className="truncate">{shipment.address}</span>
          </div>
        </td>
        <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
          {assigningHubId === shipment._id ? (
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold"><Loader2 className="w-4 h-4 animate-spin" /> Routing...</div>
          ) : (
            <select
              className={`appearance-none px-3 py-2 rounded-xl text-xs font-bold border transition-all outline-none cursor-pointer ${shipment.hub ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
              value={shipment.hub?._id || ""}
              onChange={(e) => onAssignHub(shipment._id, e.target.value)}
            >
              <option value="" disabled>Route to Hub</option>
              {hubs.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
          )}
        </td>
        <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
          {assigningId === shipment._id ? (
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold"><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</div>
          ) : (
            <select
              className={`appearance-none px-3 py-2 rounded-xl text-xs font-bold border transition-all outline-none cursor-pointer ${shipment.agent ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
              value={shipment.agent?._id || ""}
              onChange={(e) => onAssignAgent(shipment._id, e.target.value)}
            >
              <option value="" disabled>Assign Agent</option>
              {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          )}
        </td>
        <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
          <span className={`px-3 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-full border ${getStatusBadge(shipment.status)}`}>
            {shipment.status}
          </span>
        </td>
      </tr>

      {/* ── Expanded Row ── */}
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={6} className="px-0 py-0 border-b border-slate-100">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-16 py-5 bg-slate-50 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* POD badge if photo exists */}
                    {shipment.proofOfDelivery && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                        <ImageIcon className="w-3 h-3" /> POD Photo attached
                      </span>
                    )}
                    {shipment.otpVerified && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3" /> OTP Verified
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onPrintLabel(shipment); }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-[0.18em] border-2 border-black shadow-[4px_4px_0_0_#111827] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:scale-95"
                    >
                      <Scan className="w-3.5 h-3.5" /> Print Label
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewDetail(shipment._id); }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#2d66ff] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.18em] border-2 border-black shadow-[4px_4px_0_0_#ff3399] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:scale-95"
                    >
                      <History className="w-3.5 h-3.5" /> Full Audit Trail
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(shipment); }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-black/20 text-black/70 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] hover:border-black/40 hover:bg-black/2 transition-all active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Details
                    </button>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Print Manifest Modal ─────────────────────────────────────────────────────
function PrintManifestModal({ shipment, onClose }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({
    type: "SHIPMENT_LABEL",
    trackingId: shipment.trackingId,
  }))}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl space-y-8 p-10 relative"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900">
          <X className="size-6" />
        </button>
        <div className="text-center space-y-2">
          <h3 className="text-3xl font-black tracking-tighter uppercase italic">Manifest Label</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ShipNova Inbound Processing</p>
        </div>
        <div className="border-4 border-slate-900 rounded-3xl p-8 space-y-8 bg-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-900 -rotate-45 translate-x-12 -translate-y-12" />
          <div className="flex justify-between items-start border-b-2 border-slate-900/10 pb-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase text-slate-400">Tracking ID</p>
              <p className="text-xl font-black font-mono tracking-widest">{shipment.trackingId}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[9px] font-black uppercase text-red-600">Routing Hub</p>
              <p className="text-sm font-black uppercase">{shipment.hub?.name || "UNROUTED"}</p>
            </div>
          </div>
          <div className="flex justify-center py-2">
            <div className="p-4 bg-white border-4 border-slate-900 rounded-3xl shadow-xl">
              <img src={qrUrl} alt="Shipnova QR" className="w-40 h-40" />
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t-2 border-slate-900/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Recipient</p>
                <p className="text-[11px] font-black uppercase truncate">{shipment.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Status</p>
                <p className="text-[11px] font-black uppercase">{shipment.status}</p>
              </div>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Destination</p>
              <p className="text-[10px] font-black leading-tight uppercase line-clamp-2">{shipment.address}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          🖨️ Print This Label
        </button>
      </motion.div>
    </div>
  );
}

// ─── Edit Shipment Modal ──────────────────────────────────────────────────────
function EditShipmentModal({ shipment, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    customerName: shipment.customerName || "",
    customerEmail: shipment.customerEmail || "",
    address: shipment.address || "",
    phoneNumber: shipment.phoneNumber || "",
    packageDetails: shipment.packageDetails || "",
    estimatedDelivery: shipment.estimatedDelivery || "",
    resendEmail: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(`${API}/shipments/${shipment._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate();
    } catch (err) {
      alert("Failed to update shipment: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-4xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-bl-full opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-600" /> Edit Shipment
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 font-mono">
              {shipment.trackingId}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white text-slate-500 shadow-sm transition-all relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[70vh]">
          <form id="editForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Recipient Name</label>
                <input required type="text" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                <input required type="email" value={formData.customerEmail} onChange={(e) => setFormData({...formData, customerEmail: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Phone Number</label>
                <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Estimated Delivery</label>
                <input type="date" value={formData.estimatedDelivery} onChange={(e) => setFormData({...formData, estimatedDelivery: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 outline-none focus:border-indigo-600 focus:bg-white transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Destination Address</label>
              <textarea required rows="2" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all resize-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Package Payload Details</label>
              <textarea required rows="2" value={formData.packageDetails} onChange={(e) => setFormData({...formData, packageDetails: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all resize-none" />
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-4 cursor-pointer hover:bg-indigo-100/50 transition-colors" onClick={() => setFormData({...formData, resendEmail: !formData.resendEmail})}>
              <div className="pt-0.5">
                <input type="checkbox" checked={formData.resendEmail} onChange={() => {}} className="w-4 h-4 rounded text-indigo-600 focus:ring-0" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                 <Mail className="w-4 h-4"/> Resend Tracking Email
                </p>
                <p className="text-[10px] font-bold text-indigo-700/80 mt-1 leading-relaxed">
                  Toggle this to immediately re-send an updated tracking link to the email address above. Use this if you fixed a typo in the original email.
                </p>
              </div>
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} type="button" className="px-6 py-3 border-2 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white transition-colors">
            Cancel
          </button>
          <button form="editForm" type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center min-w-35 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ActiveShipments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [shipments, setShipments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [assigningHubId, setAssigningHubId] = useState(null);
  const [printShipment, setPrintShipment] = useState(null);
  const [detailShipmentId, setDetailShipmentId] = useState(null);
  const [editShipment, setEditShipment] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchData = useCallback(async (isPolling = false) => {
    try {
      const token = localStorage.getItem("userToken");
      const [shipmentsRes, agentsRes, hubsRes] = await Promise.all([
        axios.get(`${API}/shipments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/auth/agents`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/hubs`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setShipments(shipmentsRes.data);
      setAgents(agentsRes.data);
      setHubs(hubsRes.data);
    } catch (err) {
      if (!isPolling) setError(err.response?.data?.message || "Failed to load dispatch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(() => fetchData(true), 5000); // 5 sec live polling
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAssignAgent = async (shipmentId, agentId) => {
    if (!agentId) return;
    setAssigningId(shipmentId);
    try {
      const token = localStorage.getItem("userToken");
      await axios.post(`${API}/shipments/${shipmentId}/assign-agent`, { agentId }, { headers: { Authorization: `Bearer ${token}` } });
      const assignedAgent = agents.find((a) => a._id === agentId);
      setShipments((prev) => prev.map((s) => (s._id === shipmentId ? { ...s, agent: assignedAgent } : s)));
    } catch {
      alert("Assignment failed");
    } finally {
      setAssigningId(null);
    }
  };

  const handleAssignHub = async (shipmentId, hubId) => {
    if (!hubId) return;
    setAssigningHubId(shipmentId);
    try {
      const token = localStorage.getItem("userToken");
      await axios.post(`${API}/hubs/${hubId}/assign-shipment`, { shipmentId }, { headers: { Authorization: `Bearer ${token}` } });
      const assignedHub = hubs.find((h) => h._id === hubId);
      setShipments((prev) => prev.map((s) => (s._id === shipmentId ? { ...s, hub: assignedHub } : s)));
    } catch {
      alert("Hub routing failed");
    } finally {
      setAssigningHubId(null);
    }
  };

  const statusFilters = ["all", "Created", "Picked Up", "At Sorting Facility", "In Transit", "Out for Delivery", "Delivered", "Failed / Retry / Returned"];

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Live Dispatch Board</h1>
          <p className="text-black/50 font-medium text-sm">
            Click a row to see quick actions. Click <strong className="text-black">Full Audit Trail</strong> to view agent photos and timeline.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border-2 border-black/15 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-black focus:shadow-[4px_4px_0_0_#2d66ff] transition-all w-56"
            />
          </div>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.18em] border-2 transition-all ${
              filterStatus === s
                ? "bg-black text-white border-black shadow-[4px_4px_0_0_#2d66ff]"
                : "bg-white text-black/55 border-black/15 hover:border-black/35"
            }`}
          >
            {s === "all" ? "All" : s} {s !== "all" && `(${shipments.filter(x => x.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border-2 border-black/10 rounded-[30px] overflow-hidden shadow-[0_8px_20px_rgba(2,6,23,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.2em] text-black/45 font-black border-b border-black/10 bg-black/2">
                <th className="px-6 py-5">Tracking_ID</th>
                <th className="px-6 py-5">Recipient</th>
                <th className="px-6 py-5">Destination</th>
                <th className="px-6 py-5">Hub_Route</th>
                <th className="px-6 py-5">Dispatch_Agent</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 border-t border-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
                  <p className="text-slate-400 font-bold text-sm">Syncing dispatch board...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-red-400 font-bold text-sm">{error}</td></tr>
              ) : filteredShipments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center">
                  <Package className="w-12 h-12 text-slate-100 mx-auto mb-4 stroke-[1.5]" />
                  <p className="text-slate-400 font-bold text-sm">No shipments found.</p>
                </td></tr>
              ) : (
                filteredShipments.map((shipment) => (
                  <ShipmentRow
                    key={shipment._id}
                    shipment={shipment}
                    agents={agents}
                    hubs={hubs}
                    assigningId={assigningId}
                    assigningHubId={assigningHubId}
                    onAssignAgent={handleAssignAgent}
                    onAssignHub={handleAssignHub}
                    onPrintLabel={(s) => setPrintShipment(s)}
                    onViewDetail={(id) => setDetailShipmentId(id)}
                    onEdit={(s) => setEditShipment(s)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total", val: shipments.length, color: "bg-white text-black/75 border-black/20" },
          { label: "Delivered", val: shipments.filter((s) => s.status === "Delivered").length, color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
          { label: "In Transit", val: shipments.filter((s) => s.status === "In Transit").length, color: "bg-blue-50 text-blue-800 border-blue-200" },
          { label: "Out for Delivery", val: shipments.filter((s) => s.status === "Out for Delivery").length, color: "bg-amber-50 text-amber-800 border-amber-200" },
          { label: "Failed", val: shipments.filter((s) => s.status === "Failed / Retry / Returned").length, color: "bg-rose-50 text-rose-800 border-rose-200" },
          { label: "With POD Photo", val: shipments.filter((s) => s.proofOfDelivery).length, color: "bg-violet-50 text-violet-800 border-violet-200" },
        ].map((p) => (
          <div key={p.label} className={`px-5 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-[0.18em] ${p.color}`}>
            {p.label}: {p.val}
          </div>
        ))}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {printShipment && <PrintManifestModal shipment={printShipment} onClose={() => setPrintShipment(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {detailShipmentId && (
          <ShipmentDetailModal shipmentId={detailShipmentId} onClose={() => setDetailShipmentId(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editShipment && (
          <EditShipmentModal shipment={editShipment} onClose={() => setEditShipment(null)} onUpdate={() => {
            setEditShipment(null);
            fetchData();
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}
