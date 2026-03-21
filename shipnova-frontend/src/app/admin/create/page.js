"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { PackagePlus, CheckCircle2, MapPin, User, Calendar, Box, Mail, Phone, Map } from "lucide-react";

export default function CreateShipment() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    phoneNumber: "",
    customerAddress: "",
    packageDetails: "Standard Box",
    hub: "",
    agent: "",
    estimatedDelivery: ""
  });
  
  const [hubs, setHubs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const [hubsRes, agentsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/hubs`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/agents`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setHubs(hubsRes.data);
        setAgents(agentsRes.data);
      } catch (err) {
        console.error("Failed to fetch hubs or agents", err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("userToken");
      const payload = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        address: formData.customerAddress,
        phoneNumber: formData.phoneNumber,
        packageDetails: formData.packageDetails,
        hub: formData.hub || null,
        agent: formData.agent || null,
        estimatedDelivery: formData.estimatedDelivery || null
      };

      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/shipments`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Shipment Created! Tracking ID: ${data.trackingId}`);
      setFormData({
        customerName: "", customerEmail: "", phoneNumber: "", customerAddress: "", packageDetails: "Standard Box",
        hub: "", agent: "", estimatedDelivery: ""
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create shipment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">Create New Shipment</h1>
        <p className="text-neutral-500 font-medium">Generate a tracking ID and enter a new package into the system with full routing details.</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl p-10 shadow-sm">
        {success && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center text-emerald-700 font-semibold gap-3 animate-in fade-in slide-in-from-top-4">
             <CheckCircle2 className="size-6" />
             <div className="flex flex-col">
                <span className="text-sm">Success Protocol Initialized</span>
                <span className="text-xs font-bold opacity-80">{success}</span>
             </div>
          </div>
        )}
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 font-bold text-sm">
             {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section: Customer Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <User className="size-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Recipient Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 ml-1">Recipient Name</label>
                <input 
                  type="text" required value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  placeholder="Jane Doe"
                  className="w-full px-5 py-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 ml-1">Email ID</label>
                <input 
                  type="email" required value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  placeholder="jane@example.com"
                  className="w-full px-5 py-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 ml-1">Phone Number</label>
                <input 
                  type="text" required value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-5 py-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 ml-1">Destination Address</label>
                <input 
                  type="text" required value={formData.customerAddress}
                  onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                  placeholder="123 Logistics Way, Sector 4"
                  className="w-full px-5 py-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Routing & Logistics */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <MapPin className="size-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Logistics & Assignment</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 ml-1">Target Hub</label>
                <select 
                  value={formData.hub}
                  onChange={(e) => setFormData({...formData, hub: e.target.value})}
                  className="w-full px-5 py-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold text-sm appearance-none cursor-pointer"
                >
                  <option value="">Auto-select Hub...</option>
                  {hubs.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 ml-1">Dispatch Agent</label>
                <select 
                  value={formData.agent}
                  onChange={(e) => setFormData({...formData, agent: e.target.value})}
                  className="w-full px-5 py-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold text-sm appearance-none cursor-pointer"
                >
                  <option value="">Auto-assign Agent...</option>
                  {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 ml-1">Est. Delivery Date</label>
                <input 
                  type="date"
                  value={formData.estimatedDelivery}
                  onChange={(e) => setFormData({...formData, estimatedDelivery: e.target.value})}
                  className="w-full px-5 py-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Package Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Box className="size-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Package Payload</h3>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 ml-1">Manifest Details</label>
              <textarea 
                required value={formData.packageDetails}
                onChange={(e) => setFormData({...formData, packageDetails: e.target.value})}
                placeholder="e.g. 5kg Electronics Box, Fragile..."
                rows={3}
                className="w-full px-5 py-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-sm resize-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-100 flex justify-end gap-5">
             <button 
                type="button" 
                onClick={() => router.push("/admin/shipments")} 
                className="px-8 py-4 font-bold text-neutral-400 hover:text-neutral-900 transition-colors uppercase tracking-widest text-[10px]"
             >
               Abort Creation
             </button>
             <button 
                type="submit" 
                disabled={loading || fetchingData} 
                className={`flex items-center px-10 py-4 bg-indigo-600 text-white rounded-[20px] font-black uppercase tracking-widest text-[11px] hover:bg-indigo-700 hover:translate-y-[-2px] transition-all shadow-xl shadow-indigo-100 active:scale-95 ${loading ? 'opacity-50' : ''}`}
             >
               {loading ? (
                 <span className="flex items-center gap-2 italic">Generating Manifest...</span>
               ) : (
                 <span className="flex items-center gap-2">Initialize Shipment Dispatch →</span>
               )}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
