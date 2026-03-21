"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Truck,
  CheckCircle2,
  Clock3,
  X,
  Loader2,
  Package,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function AgentDetailModal({ agent, stats, onClose }) {
  if (!agent) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border-2 border-black/10 rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(2,6,23,0.12)]"
      >
        <div className="px-6 py-5 border-b border-black/10 flex items-center justify-between bg-black/2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Agent Profile</p>
            <h3 className="text-2xl font-black tracking-tight text-black mt-1">{agent.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 text-black/55">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-black/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-black/40 mb-2">Contact</p>
              <div className="space-y-2 text-sm font-bold text-black/75">
                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-black/35" />{agent.email || "-"}</p>
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-black/35" />{agent.phone || "Not added"}</p>
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-black/35" />{agent.address || "Not added"}</p>
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-black/40 mb-2">Performance</p>
              <div className="space-y-2 text-sm font-bold text-black/80">
                <p className="flex items-center justify-between"><span>Total Assigned</span><span>{stats.totalAssigned}</span></p>
                <p className="flex items-center justify-between"><span>Delivered</span><span>{stats.delivered}</span></p>
                <p className="flex items-center justify-between"><span>Active Orders</span><span>{stats.active}</span></p>
                <p className="flex items-center justify-between"><span>Waiting at this Hub</span><span>{stats.waitingAtHub}</span></p>
              </div>
            </div>
          </div>

          <div className="bg-black/2 border border-black/10 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-black/45 mb-3">Recent Deliveries</p>
            {stats.recentDelivered.length === 0 ? (
              <p className="text-sm text-black/45 font-bold">No delivered shipments yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.recentDelivered.map((shipment) => (
                  <div key={shipment._id} className="flex items-center justify-between text-sm border-b border-black/5 pb-2">
                    <span className="font-mono font-black text-black/75">{shipment.trackingId}</span>
                    <span className="font-bold text-black/50 truncate max-w-[45%]">{shipment.customerName}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                      Delivered
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegionalAgents() {
  const [agents, setAgents] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [activeHandoverMap, setActiveHandoverMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [hubId, setHubId] = useState(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const [hubsRes, agentsRes, shipmentsRes] = await Promise.all([
        axios.get(`${API}/hubs`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/auth/agents`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/shipments`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const myHub = hubsRes.data[0];
      if (myHub) {
        setHubId(myHub._id);
        const { data: hubDetails } = await axios.get(`${API}/hubs/${myHub._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const assignedMap = {};
        hubDetails.shipments.forEach((s) => {
          if (s.agent?._id) assignedMap[s.agent._id] = (assignedMap[s.agent._id] || 0) + 1;
        });
        setActiveHandoverMap(assignedMap);
      }

      setAgents(agentsRes.data);
      setShipments(shipmentsRes.data);
    } catch (error) {
      console.error("Failed to sync field force matrix", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const agentStatsMap = useMemo(() => {
    const map = {};

    agents.forEach((agent) => {
      const owned = shipments.filter((s) => s.agent?._id === agent._id);
      const delivered = owned.filter((s) => s.status === "Delivered");
      const active = owned.filter((s) => !["Delivered", "Failed / Retry / Returned"].includes(s.status));

      map[agent._id] = {
        totalAssigned: owned.length,
        delivered: delivered.length,
        active: active.length,
        waitingAtHub: activeHandoverMap[agent._id] || 0,
        recentDelivered: [...delivered]
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 5),
      };
    });

    return map;
  }, [agents, shipments, activeHandoverMap]);

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("userToken");
      await axios.post(
        `${API}/auth/agents`,
        {
          ...formData,
          primaryHub: hubId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowModal(false);
      setFormData({ name: "", email: "", password: "" });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create agent.");
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center gap-3 text-black/50 font-black uppercase tracking-widest text-xs">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading field force...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-2">Hub Manager</p>
          <h1 className="text-4xl font-black tracking-tighter text-black">Field Force</h1>
          <p className="text-sm font-medium text-black/50 mt-1">Click an agent card to view details, deliveries, contact and address.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl border-2 border-black text-[11px] font-black uppercase tracking-[0.14em] shadow-[6px_6px_0_0_#2d66ff] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 transition-all"
        >
          <UserPlus className="w-4 h-4" /> Add Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const stats = agentStatsMap[agent._id] || {
            totalAssigned: 0,
            delivered: 0,
            active: 0,
            waitingAtHub: 0,
            recentDelivered: [],
          };

          return (
            <button
              key={agent._id}
              onClick={() => setSelectedAgent(agent)}
              className="text-left bg-white border-2 border-black/10 rounded-2xl p-5 hover:border-black/35 hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-black text-white font-black flex items-center justify-center">
                  {(agent.name || "A").charAt(0).toUpperCase()}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full border ${
                  stats.waitingAtHub > 0
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  {stats.waitingAtHub > 0 ? `${stats.waitingAtHub} waiting` : "ready"}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-black tracking-tight text-black">{agent.name}</h3>
              <p className="mt-1 text-xs font-bold text-black/45 flex items-center gap-1"><Mail className="w-3 h-3" />{agent.email}</p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-black/10 p-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-black/40">Assigned</p>
                  <p className="text-lg font-black text-black">{stats.totalAssigned}</p>
                </div>
                <div className="rounded-xl border border-black/10 p-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-black/40">Delivered</p>
                  <p className="text-lg font-black text-emerald-700">{stats.delivered}</p>
                </div>
                <div className="rounded-xl border border-black/10 p-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-black/40">Active</p>
                  <p className="text-lg font-black text-blue-700">{stats.active}</p>
                </div>
              </div>
            </button>
          );
        })}

        {agents.length === 0 && (
          <div className="col-span-full py-14 text-center bg-black/2 border-2 border-dashed border-black/15 rounded-2xl">
            <Users className="w-10 h-10 mx-auto text-black/30 mb-3" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">No agents registered yet</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAgent && (
          <AgentDetailModal
            agent={selectedAgent}
            stats={agentStatsMap[selectedAgent._id] || { totalAssigned: 0, delivered: 0, active: 0, waitingAtHub: 0, recentDelivered: [] }}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white border-2 border-black/10 rounded-3xl p-6"
            >
              <h2 className="text-2xl font-black tracking-tight text-black">Create Agent</h2>
              <p className="text-xs font-medium text-black/50 mt-1 mb-5">Add a new delivery agent for your tenant.</p>

              <form onSubmit={handleCreateAgent} className="space-y-4">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border-2 border-black/15 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-black"
                  placeholder="Full name"
                />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full border-2 border-black/15 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-black"
                  placeholder="Email"
                />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full border-2 border-black/15 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-black"
                  placeholder="Password"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 border-2 border-black/15 rounded-xl py-3 text-[10px] font-black uppercase tracking-[0.16em] text-black/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white border-2 border-black rounded-xl py-3 text-[10px] font-black uppercase tracking-[0.16em]"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
