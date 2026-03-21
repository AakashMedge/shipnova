"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { MapPin, PlusCircle, Server, Activity, ArrowRight } from "lucide-react";

export default function HubsPage() {
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHub, setEditingHub] = useState(null);
  const [formData, setFormData] = useState({ name: "", location: "", managerEmail: "", managerPassword: "" });

  const fetchHubs = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHubs(data);
    } catch (error) {
      console.error("Failed to fetch hubs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubs();
  }, []);

  const handleCreateHub = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("userToken");
      if (editingHub) {
         await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/hubs/${editingHub._id}`, formData, {
            headers: { Authorization: `Bearer ${token}` }
         });
      } else {
         await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/hubs`, formData, {
            headers: { Authorization: `Bearer ${token}` }
         });
      }
      setShowModal(false);
      setEditingHub(null);
      setFormData({ name: "", location: "", managerEmail: "", managerPassword: "" });
      fetchHubs();
    } catch (error) {
      alert(`Operation failed: ${error.response?.data?.message || "Please check your connection."}`);
    }
  };

  const openEditModal = (hub) => {
     setEditingHub(hub);
     setFormData({ 
        name: hub.name, 
        location: hub.location, 
        managerEmail: hub.manager?.email || "", 
        managerPassword: "" 
     });
     setShowModal(true);
  };

  if (loading) return <div className="p-8 text-black/50">Loading Network Hubs...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight mb-2">Network Hubs & Warehouses</h1>
          <p className="text-black/60 font-medium">Manage distribution centers and sort facilities for your transit network.</p>
        </div>
        <button 
          onClick={() => { setEditingHub(null); setFormData({ name: "", location: "", managerEmail: "", managerPassword: "" }); setShowModal(true); }}
          className="bg-black hover:bg-black/80 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl"
        >
          <PlusCircle className="w-5 h-5" />
          Deploy New Hub
        </button>
      </div>

      {/* Stats/Summary Row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4">
           <div className="bg-indigo-500/10 p-4 rounded-xl">
             <Server className="w-6 h-6 text-indigo-600" />
           </div>
           <div>
             <p className="text-sm font-bold text-black/40 uppercase tracking-widest">Active Hubs</p>
             <p className="text-3xl font-black text-black">{hubs.length}</p>
           </div>
        </div>
      </div>

      {/* Hubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubs.map(hub => (
          <div key={hub._id} className="bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-xl transition-shadow p-6 flex flex-col justify-between">
            <div>
               <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-500/10 p-3 rounded-xl">
                    <Activity className="w-5 h-5 text-emerald-600" />
                  </div>
                   <div className="flex gap-2">
                      <button 
                         onClick={() => openEditModal(hub)}
                         className="px-3 py-1 bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                         {hub.manager ? "Edit" : "Provision"}
                      </button>
                      <span className="px-3 py-1 bg-black/5 rounded-full text-[10px] font-black uppercase tracking-widest text-black/50">Online</span>
                   </div>
               </div>
               <h3 className="text-xl font-black text-black tracking-tight mb-1">{hub.name}</h3>
               <div className="flex items-center gap-2 text-black/50 text-sm font-medium mt-3">
                 <MapPin className="w-4 h-4" />
                 {hub.location}
               </div>
               
               <Link 
                  href={`/admin/hubs/${hub._id}`}
                  className="mt-6 w-full flex items-center justify-between p-3 rounded-xl border border-black/5 bg-black/5 hover:bg-black hover:text-white transition-all group"
               >
                  <span className="text-[10px] font-black uppercase tracking-widest pl-1">View Inventory</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
               </Link>

              <Link
                href={`/admin/hubs/${hub._id}/chat`}
                className="mt-2 w-full flex items-center justify-between p-3 rounded-xl border border-black/10 bg-white hover:border-indigo-500 hover:text-indigo-600 transition-all group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest pl-1">Open Hub Chat</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
            <h2 className="text-2xl font-black tracking-tight mb-6">{editingHub ? "Update Hub Terminal" : "Deploy New Hub"}</h2>
            <form onSubmit={handleCreateHub} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1.5 block">Facility Name</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. Northeast Sorting Center"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1.5 block">Physical Location</label>
                <input 
                  type="text" required
                  value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. 123 Warehouse Row, NY"
                />
              </div>

              <div className="pt-4 border-t border-black/5 mt-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4">Manager Credentials (Optional)</p>
                 <div className="space-y-4">
                    <div>
                       <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1 block">Manager Email</label>
                       <input 
                          type="email"
                          value={formData.managerEmail} onChange={e => setFormData({...formData, managerEmail: e.target.value})}
                          className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-indigo-500"
                          placeholder="manager@shipnova.com"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1 block">Set Password</label>
                       <input 
                          type="password"
                          value={formData.managerPassword} onChange={e => setFormData({...formData, managerPassword: e.target.value})}
                          className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-indigo-500"
                          placeholder="••••••••"
                       />
                    </div>
                 </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-black/5 hover:bg-black/10 text-black transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] py-3 px-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-500/30">
                   {editingHub ? "Commit Changes" : "Deploy Hub"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
