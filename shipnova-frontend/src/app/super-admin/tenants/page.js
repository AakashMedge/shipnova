"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Building, Plus, Loader2, CheckCircle2, 
  User, Shield, Mail, Calendar, Power,
  X, AlertCircle, Trash2, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function TenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Create Form State
  const [name, setName] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  const [notification, setNotification] = useState(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const [tenantsRes, plansRes] = await Promise.all([
        axios.get(`${API}/tenants`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API}/plans`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setTenants(tenantsRes.data);
      setPlans(plansRes.data);
      if (plansRes.data.length > 0) setSubscriptionPlan(plansRes.data[0].name);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("userToken");
      await axios.post(`${API}/tenants`, { 
        name, subscriptionPlan, isActive: true,
        adminName, adminEmail, adminPassword
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      setNotification({ type: "success", text: `${name} initialized with Admin account.` });
      setName(""); setAdminName(""); setAdminEmail(""); setAdminPassword("");
      fetchData();
    } catch (err) {
      setNotification({ type: "error", text: err.response?.data?.message || "Failed to create" });
    }
  };

  const viewTenantDetails = async (id) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.get(`${API}/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTenant(data);
    } catch (err) {
      alert("Failed to load details");
    } finally {
      setModalLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!selectedTenant) return;
    const id = selectedTenant.tenant._id;
    try {
      const token = localStorage.getItem("userToken");
      await axios.patch(`${API}/tenants/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh local data
      fetchData();
      viewTenantDetails(id); // Refresh modal
    } catch (err) {
      alert("Operation failed");
    }
  };

  const getSubBadge = (plan) => {
    const p = plan?.toLowerCase();
    if (p?.includes("enterprise")) return "bg-purple-900/40 text-purple-400 border-purple-800 shadow-sm shadow-purple-900/20";
    if (p?.includes("professional") || p?.includes("pro")) return "bg-indigo-900/40 text-indigo-400 border-indigo-800 shadow-sm shadow-indigo-900/20";
    return "bg-neutral-800 text-neutral-400 border-neutral-700";
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-black italic tracking-tighter text-white mb-2">Tenant Logistics</h1>
        <p className="text-neutral-400 font-medium">Global fleet management and administrative suspension controls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Form */}
        <div className="col-span-1 bg-black border border-neutral-800 rounded-[32px] p-8 shadow-2xl h-fit">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-cyan-500" />
              <span className="font-black text-white italic uppercase tracking-widest text-sm">Onboard Fleet</span>
            </div>
          </div>

          <form onSubmit={handleCreateTenant} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Company Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-3.5 text-sm font-bold text-white outline-none focus:border-cyan-500 transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Subscription Plan</label>
              <select value={subscriptionPlan} onChange={(e) => setSubscriptionPlan(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-3.5 text-sm font-bold text-white outline-none focus:border-cyan-500 transition-all appearance-none">
                {plans.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div className="pt-6 border-t border-neutral-800 space-y-4">
              <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest bg-cyan-900/20 px-3 py-1.5 rounded-lg w-fit">Master Admin Link</p>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <input required value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-cyan-500" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Email Endpoint</label>
                <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-cyan-500" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Access Key</label>
                <input type="password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-cyan-500" />
              </div>
            </div>

            <button type="submit" className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-cyan-900/20 active:scale-95 transition-all">
               Initialize & Sync
            </button>
          </form>
        </div>

        {/* List Table */}
        <div className="col-span-1 lg:col-span-2 bg-black border border-neutral-800 rounded-[32px] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-900/50 border-b border-neutral-800">
                <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Infrastructure</th>
                <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Access tier</th>
                <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Connectivity</th>
                <th className="px-8 py-5 text-right font-black text-neutral-500 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {loading ? (
                <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-800" /></td></tr>
              ) : (
                tenants.map(t => (
                  <tr key={t._id} className="group hover:bg-neutral-900/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-500 group-hover:text-cyan-400 group-hover:border-cyan-900 transition-colors">
                            <Building className="w-5 h-5" />
                         </div>
                         <p className="font-black text-white italic tracking-tight">{t.name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${getSubBadge(t.subscriptionPlan)}`}>
                         {t.subscriptionPlan}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       {t.isActive ? (
                         <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />Online</div>
                       ) : (
                         <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase"><div className="w-2 h-2 rounded-full bg-red-500" />Offline</div>
                       )}
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                         onClick={() => viewTenantDetails(t._id)}
                         className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-all"
                       >
                          Analyze
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelectedTenant(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div 
              initial={{scale:0.95, opacity:0, y: 20}} animate={{scale:1, opacity:1, y: 0}} exit={{scale:0.95, opacity:0, y: 20}}
              className="bg-neutral-950 border border-neutral-800 w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden relative z-10"
            >
              {modalLoading ? (
                 <div className="py-40 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-4" />
                    <p className="text-neutral-500 font-black uppercase tracking-[0.3em] text-[10px]">Retrieving Core Data...</p>
                 </div>
              ) : (
                <div className="flex flex-col md:flex-row h-[600px]">
                   {/* Left Panel: Profile */}
                   <div className="w-full md:w-[380px] bg-black p-12 flex flex-col justify-between border-r border-neutral-800">
                      <div>
                        <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-[32px] flex items-center justify-center text-cyan-500 mb-8">
                           <Shield className="w-10 h-10" />
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter text-white mb-2 leading-none">{selectedTenant.tenant.name}</h2>
                        <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border inline-block mt-4 ${getSubBadge(selectedTenant.tenant.subscriptionPlan)}`}>
                           {selectedTenant.tenant.subscriptionPlan} Protocol
                        </span>
                      </div>

                      <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                           <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Initialization Date</p>
                           <p className="text-white font-bold">{new Date(selectedTenant.tenant.createdAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                           <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Encryption Token</p>
                           <p className="text-neutral-300 font-mono text-xs truncate">SHA-256_{selectedTenant.tenant._id}</p>
                        </div>
                      </div>
                   </div>

                   {/* Right Panel: Admin & Controls */}
                   <div className="flex-1 p-12 bg-neutral-950 flex flex-col justify-between">
                      <div className="space-y-12">
                         <div className="flex justify-between items-start">
                            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">Administrative Oversight</h3>
                            <button onClick={() => setSelectedTenant(null)} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-600 hover:text-white transition-colors">
                               <X className="w-6 h-6" />
                            </button>
                         </div>

                         {selectedTenant.masterAdmin ? (
                            <div className="grid grid-cols-1 gap-8">
                               <div className="bg-black/50 border border-neutral-800 rounded-3xl p-8 flex items-center gap-6">
                                  <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-cyan-900/10">
                                     <User className="w-8 h-8" />
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-1 italic">Master Admin Provisioned</p>
                                     <h4 className="text-xl font-black text-white tracking-tight">{selectedTenant.masterAdmin.name}</h4>
                                     <p className="text-neutral-500 font-bold text-xs">{selectedTenant.masterAdmin.email}</p>
                                  </div>
                               </div>

                               <div className="flex flex-col gap-4">
                                  <button disabled className="w-full flex items-center justify-between p-6 bg-neutral-900/30 border border-neutral-800 rounded-3xl opacity-50 cursor-not-allowed">
                                     <div className="flex items-center gap-4 text-neutral-400">
                                        <Mail className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Reset Admin Security Key</span>
                                     </div>
                                     <ArrowRight className="w-4 h-4" />
                                  </button>
                                  <button disabled className="w-full flex items-center justify-between p-6 bg-neutral-900/30 border border-neutral-800 rounded-3xl opacity-50 cursor-not-allowed">
                                     <div className="flex items-center gap-4 text-neutral-400">
                                        <Power className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Revoke API Key Access</span>
                                     </div>
                                     <ArrowRight className="w-4 h-4" />
                                  </button>
                               </div>
                            </div>
                         ) : (
                            <div className="p-10 border border-dashed border-neutral-800 rounded-3xl text-center">
                               <AlertCircle className="w-8 h-8 mx-auto text-neutral-700 mb-3" />
                               <p className="text-neutral-500 font-black uppercase text-[10px] tracking-widest">No Admin Linked to Infrastructure</p>
                            </div>
                         )}
                      </div>

                      <div className="flex flex-col gap-4 pt-12 border-t border-neutral-800/50">
                         <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] text-center mb-2">Master Kill Switch Logic</p>
                         <div className="grid grid-cols-2 gap-4">
                            <button 
                              onClick={toggleStatus}
                              className={`py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 ${selectedTenant.tenant.isActive ? "bg-red-950/20 text-red-500 border border-red-900/50 hover:bg-red-900/30" : "bg-emerald-950/20 text-emerald-500 border border-emerald-900/50 hover:bg-emerald-900/30"}`}
                            >
                               {selectedTenant.tenant.isActive ? <Power className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                               {selectedTenant.tenant.isActive ? "Suspend Protocol" : "Authorize Access"}
                            </button>
                            <button className="py-5 bg-neutral-900 text-neutral-500 border border-neutral-800 rounded-3xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:text-white transition-colors opacity-50 cursor-not-allowed">
                               <Trash2 className="w-5 h-5" /> Purge Database
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
