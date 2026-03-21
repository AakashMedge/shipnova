"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  CreditCard, ShieldCheck, Zap, Globe, 
  CheckCircle2, AlertCircle, Loader2, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL;

const DEFAULT_PLANS = [
  {
    _id: "default-starter",
    name: "Starter",
    price: "$0",
    description: "Launch your independent courier company with digital logistics.",
    features: ["500 Shipments/mo", "2 Managed Hubs", "Email Alerts", "Standard Tracking"],
    displayOrder: 1,
  },
  {
    _id: "default-professional",
    name: "Professional",
    price: "$99",
    description: "Scale your delivery fleet with industrial grade tracking.",
    features: ["5,000 Shipments/mo", "Unlimited Hubs", "Priority Support", "Real-time Telemetry"],
    displayOrder: 2,
  },
  {
    _id: "default-enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "Global logistics infrastructure for massive corporations.",
    features: ["Unlimited Everything", "White-label Portal", "24/7 Priority Support", "Direct Database Access"],
    displayOrder: 3,
  },
];

const mergeDefaultPlans = (apiPlans = []) => {
  const normalizedDefaults = DEFAULT_PLANS.map((plan) => ({
    ...plan,
    _key: plan.name.toLowerCase(),
  }));

  const normalizedApiPlans = apiPlans.map((plan) => ({
    ...plan,
    _key: plan.name?.toLowerCase?.() || "",
  }));

  const mergedByName = normalizedDefaults.map((defaultPlan) => {
    const apiMatch = normalizedApiPlans.find((apiPlan) => apiPlan._key === defaultPlan._key);
    return apiMatch || defaultPlan;
  });

  const extras = normalizedApiPlans.filter(
    (apiPlan) => !normalizedDefaults.some((defaultPlan) => defaultPlan._key === apiPlan._key)
  );

  return [...mergedByName, ...extras]
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
    .map(({ _key, ...rest }) => rest);
};

export default function BillingPage() {
  const [tenant, setTenant] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchTenantAndPlans = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const [tenantRes, plansRes] = await Promise.allSettled([
        axios.get(`${API}/tenants/my-tenant`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/plans`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (tenantRes.status === "fulfilled") {
        setTenant(tenantRes.value.data);
      } else {
        setMessage({ type: "error", text: "Unable to load tenant billing profile." });
      }

      if (plansRes.status === "fulfilled") {
        setPlans(mergeDefaultPlans(plansRes.value.data));
      } else {
        setPlans(DEFAULT_PLANS);
      }
    } catch (err) {
      console.error("Billing load error:", err);
      setPlans(DEFAULT_PLANS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantAndPlans();
  }, []);

  const handlePlanSwitch = async (planName) => {
    if (tenant?.subscriptionPlan === planName) return;
    
    setSwitching(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("userToken");
      await axios.patch(`${API}/tenants/subscription`, { planName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: "success", text: `Welcome to the ${planName} Plan! Your features are now active.` });
      
      // Update local tenant state to reflect change instantly
      setTenant(prev => ({...prev, subscriptionPlan: planName}));
    } catch (err) {
      setMessage({ type: "error", text: "Subscription update failed. Contact Super Admin." });
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Syncing Billing Ledger...</p>
      </div>
    );
  }

  // Visual helper for plan colors/icons based on plan name
  const getPlanStyle = (name) => {
    const n = name?.toLowerCase();
    if (n?.includes("professional") || n?.includes("pro")) {
      return { icon: ShieldCheck, color: "bg-indigo-50 text-indigo-700 border-indigo-200", btn: "bg-indigo-600" };
    }
    if (n?.includes("enterprise")) {
      return { icon: Globe, color: "bg-purple-50 text-purple-700 border-purple-200", btn: "bg-purple-700" };
    }
    return { icon: Zap, color: "bg-slate-100 text-slate-700 border-slate-200", btn: "bg-slate-900" };
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 italic">Billing & Subscription</h1>
          <p className="text-slate-400 font-medium">Manage your platform tier and view your current logistics capabilities.</p>
        </div>
        <div className="bg-white border border-slate-200 px-6 py-4 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Current Plan</p>
            <p className="text-xl font-black text-slate-900">
              {tenant?.subscriptionPlan || "Starter"}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div 
            key="notif"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className={`mb-10 p-5 rounded-[32px] flex items-center gap-4 border shadow-xl ${message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100" : "bg-red-50 border-red-200 text-red-800 shadow-red-100"}`}
          >
            <div className={`p-2 rounded-full ${message.type === "success" ? "bg-emerald-100" : "bg-red-100"}`}>
               {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <p className="font-black text-xs uppercase tracking-widest flex-1">{message.text}</p>
            <button onClick={() => setMessage(null)} className="text-[10px] font-black uppercase tracking-widest hover:underline opacity-50">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Plans Grid */}
      {plans.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 border border-slate-200 rounded-[40px]">
           <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-3" />
           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active plans configured by Super Admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isActive = tenant?.subscriptionPlan === plan.name;
            const style = getPlanStyle(plan.name);
            const Icon = style.icon;
            
            return (
              <div 
                key={plan._id}
                className={`flex flex-col bg-white border-2 rounded-[40px] p-8 transition-all duration-300 ${isActive ? "border-indigo-600 shadow-2xl shadow-indigo-100 scale-105 z-10" : "border-slate-100 opacity-90 hover:opacity-100"}`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-2.5 rounded-full shadow-xl shadow-indigo-600/20 flex items-center gap-2 whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High Performance
                  </div>
                )}

                <div className="mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${style.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-2 italic">{plan.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed mb-6 uppercase tracking-wider">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tighter text-slate-900">{plan.price}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-2 ml-1">/ mo</span>
                  </div>
                </div>

                <div className="space-y-4 mb-10 flex-1">
                  {plan.features?.map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        <CheckCircle2 className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={isActive || switching}
                  onClick={() => handlePlanSwitch(plan.name)}
                  className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 ${isActive ? "bg-slate-100 text-slate-400 border border-slate-200" : `${style.btn} text-white hover:translate-x-1 active:scale-95 shadow-xl shadow-indigo-200`}`}
                >
                  {switching ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : isActive ? "Active Subscription" : "Activate Tier"}
                  {!isActive && !switching && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
