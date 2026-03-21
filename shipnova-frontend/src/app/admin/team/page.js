"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Users, Mail, UserPlus, Loader2 } from "lucide-react";

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState({ type: "", text: "" });

  const [editingAgent, setEditingAgent] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "", profileUrl: "" });
  const [editLoading, setEditLoading] = useState(false);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgents(data);
    } catch (err) {
      setError("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("userToken");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/agents`, createForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCreateMessage({ type: "success", text: "Delivery Agent created successfully." });
      setCreateForm({ name: "", email: "", password: "" });
      setShowCreate(false);
      fetchAgents(); // Refresh the list
    } catch (err) {
      setCreateMessage({ type: "error", text: err.response?.data?.message || "Failed to create agent." });
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (agent) => {
    setEditingAgent(agent);
    setEditForm({ 
      name: agent.name || "", 
      phone: agent.phone || "", 
      address: agent.address || "", 
      profileUrl: agent.profileUrl || "" 
    });
  };

  const handleEditAgent = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/auth/agents/${editingAgent._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingAgent(null);
      fetchAgents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update agent.");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">Delivery Agents</h1>
          <p className="text-neutral-500 font-medium">Manage your delivery personnel across the network.</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Add Agent
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 mb-2">
          <h3 className="font-bold text-lg mb-4">Register New Agent</h3>
          
          {createMessage.text && (
            <div className={`p-4 rounded-lg mb-4 text-sm font-semibold ${createMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {createMessage.text}
            </div>
          )}

          <form onSubmit={handleCreateAgent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Full Name</label>
              <input type="text" required value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Email</label>
              <input type="email" required value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="jane@logistics.com" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Temporary Password</label>
              <input type="password" required value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="••••••••" />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-neutral-500 font-semibold">Cancel</button>
              <button type="submit" disabled={createLoading} className="bg-black hover:bg-neutral-800 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2">
                {createLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 font-bold">{error}</div>
        ) : agents.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 font-medium">No agents found in your network. Create one above.</div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {agents.map((agent) => (
              <li key={agent._id} className="p-6 flex items-center justify-between hover:bg-neutral-50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg border border-indigo-200">
                       {agent.profileUrl ? <img src={agent.profileUrl} alt="Avatar" className="w-full h-full object-cover" /> : agent.name.charAt(0)}
                    </div>
                    <div>
                       <p className="font-semibold text-neutral-900 mb-1">{agent.name}</p>
                       <p className="text-sm text-neutral-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {agent.email}
                          {agent.phone && <span className="ml-2 text-neutral-400">| Ph: {agent.phone}</span>}
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${agent.status === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-neutral-100 text-neutral-600 border-neutral-200"}`}>
                       {agent.status.toUpperCase()}
                    </span>
                    <button 
                       onClick={() => openEditModal(agent)}
                       className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                       Edit Profile
                    </button>
                 </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingAgent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold tracking-tight mb-4">Edit Agent Policy Details</h2>
            <form onSubmit={handleEditAgent} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Full Name</label>
                <input type="text" required value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Contact Phone</label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="+1 234 567 8900" />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Home Address</label>
                <input type="text" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="123 Agent Lane, NY" />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Avatar Image URL (Optional)</label>
                <input type="text" value={editForm.profileUrl} onChange={(e) => setEditForm({...editForm, profileUrl: e.target.value})} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="https://..." />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setEditingAgent(null)} className="px-4 py-2 text-neutral-500 font-semibold">Cancel</button>
                <button type="submit" disabled={editLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2">
                  {editLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
