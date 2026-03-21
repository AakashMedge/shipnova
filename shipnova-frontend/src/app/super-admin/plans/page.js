"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, Edit3, Trash2, CheckCircle2, 
  AlertCircle, Loader2, CreditCard, X, Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function PlansManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    price: "$0",
    description: "",
    features: [""]
  });

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.get(`${API}/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(data);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price,
        description: plan.description || "",
        features: plan.features?.length ? [...plan.features] : [""]
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        price: "$0",
        description: "",
        features: [""]
      });
    }
    setModalOpen(true);
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeatureInput = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeatureInput = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length ? newFeatures : [""] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("userToken");
    const payload = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== "")
    };

    try {
      if (editingPlan) {
        await axios.put(`${API}/plans/${editingPlan._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/plans`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this plan permanently? Tenants assigned to it may face issues.")) return;
    const token = localStorage.getItem("userToken");
    try {
      await axios.delete(`${API}/plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPlans();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white mb-2">Platform Economics</h1>
          <p className="text-neutral-400 font-medium">Define business tiers, feature sets, and visual pricing for the entire logistics mesh.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 shadow-cyan-900/20"
        >
          <Plus className="w-4 h-4" /> Create New Tier
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-black/40 border border-neutral-800 rounded-[32px]">
           <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-4" />
           <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Updating Tier Registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan._id} className="bg-black border border-neutral-800 rounded-[40px] p-8 flex flex-col gap-6 relative group overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-900/10 rounded-bl-full pointer-events-none group-hover:bg-cyan-900/20 transition-colors" />
               
               <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-800 text-cyan-500">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(plan)} className="p-2 bg-neutral-900 rounded-lg hover:text-cyan-400 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(plan._id)} className="p-2 bg-neutral-900 rounded-lg hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-1">{plan.name}</h3>
                  <p className="text-cyan-500 font-black text-xl font-mono">{plan.price}</p>
               </div>

               <p className="text-xs font-medium text-neutral-500 leading-relaxed min-h-[3em]">
                  {plan.description || "Core platform tier with standard logistics access."}
               </p>

               <div className="space-y-2.5 pt-4 border-t border-neutral-800">
                  {plan.features?.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-800" />
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{f}</span>
                    </div>
                  ))}
                  {plan.features?.length > 4 && (
                    <p className="text-[9px] font-black text-neutral-600 ml-6 uppercase">+{plan.features.length - 4} More Capabilities</p>
                  )}
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div 
              initial={{scale:0.9, opacity:0, y: 20}} animate={{scale:1, opacity:1, y: 0}} exit={{scale:0.9, opacity:0, y: 20}}
              className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative z-10"
            >
              <form onSubmit={handleSubmit}>
                <div className="p-10 border-b border-neutral-800 flex justify-between items-center">
                  <h2 className="text-3xl font-black tracking-tighter text-white italic">
                    {editingPlan ? "Configure Tier" : "Create New Tier"}
                  </h2>
                  <button type="button" onClick={() => setModalOpen(false)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-10 max-h-[60vh] overflow-y-auto space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Plan Name</label>
                       <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-neutral-800 focus:border-cyan-500 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Price Template</label>
                       <input required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-black border border-neutral-800 focus:border-cyan-500 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Commercial Description</label>
                     <textarea rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-black border border-neutral-800 focus:border-cyan-500 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none resize-none" />
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 font-mono">Platform Capabilities</label>
                        <button type="button" onClick={addFeatureInput} className="text-cyan-500 text-[10px] font-black uppercase hover:underline">Add Meta Feature</button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {formData.features.map((f, i) => (
                           <div key={i} className="flex gap-2">
                              <input value={f} onChange={(e) => handleFeatureChange(i, e.target.value)} placeholder="e.g. Unlimited Hub Access" className="flex-1 bg-black border border-neutral-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-[11px] font-bold text-neutral-300 outline-none" />
                              <button type="button" onClick={() => removeFeatureInput(i)} className="p-2 text-neutral-700 hover:text-red-500">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
                </div>

                <div className="p-10 bg-black/50 border-t border-neutral-800 flex justify-end gap-4">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-neutral-500 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-10 py-4 bg-cyan-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-white flex items-center gap-2 hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-900/20 active:scale-95">
                    <Save className="w-4 h-4" /> {editingPlan ? "Commit Changes" : "Initialize Tier"}
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
