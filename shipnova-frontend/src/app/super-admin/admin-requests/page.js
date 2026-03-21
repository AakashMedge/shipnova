"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { UserCheck, UserX, Clock, Mail, Calendar, Shield, Users, AlertTriangle } from "lucide-react";

export default function AdminRequestsPage() {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [toast, setToast] = useState(null);

  // Create Admin Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", tenant_id: "" });
  const [createLoading, setCreateLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("userToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const [pendingRes, allRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/admin-requests`, getAuthHeaders()),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/all-admins`, getAuthHeaders()),
      ]);
      setPendingAdmins(pendingRes.data);
      setAllAdmins(allRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (adminId) => {
    setActionLoading(adminId);
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/admin-requests/${adminId}/approve`,
        {},
        getAuthHeaders()
      );
      showToast("Admin approved successfully");
      await fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to approve", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (adminId) => {
    setActionLoading(adminId);
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/admin-requests/${adminId}/reject`,
        {},
        getAuthHeaders()
      );
      showToast("Admin request rejected");
      await fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to reject", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/create-admin`,
        createForm,
        getAuthHeaders()
      );
      showToast("Admin created successfully");
      setCreateForm({ name: "", email: "", password: "", tenant_id: "" });
      setShowCreateForm(false);
      await fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to create admin", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      suspended: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 text-sm font-mono">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-50 px-6 py-3 rounded-lg text-sm font-bold shadow-2xl border ${
              toast.type === "error"
                ? "bg-red-950 text-red-400 border-red-800"
                : "bg-emerald-950 text-emerald-400 border-emerald-800"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-6 h-6 text-cyan-400" />
            Admin Management
          </h1>
          <p className="text-neutral-500 text-sm mt-1 font-mono">
            Approve, reject, or create Company Admin accounts
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Create Admin
        </button>
      </div>

      {/* Create Admin Modal/Panel */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                Create New Admin
              </h3>
              <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500/50 transition-colors placeholder:text-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="admin@company.com"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500/50 transition-colors placeholder:text-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500/50 transition-colors placeholder:text-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-1">Tenant ID (optional)</label>
                  <input
                    type="text"
                    value={createForm.tenant_id}
                    onChange={(e) => setCreateForm({ ...createForm, tenant_id: e.target.value })}
                    placeholder="MongoDB ObjectId"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500/50 transition-colors placeholder:text-neutral-600"
                  />
                </div>
                <div className="md:col-span-2 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-5 py-2.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors"
                  >
                    {createLoading ? "Creating..." : "Create Admin"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-neutral-800/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === "pending"
              ? "bg-neutral-700 text-amber-400 shadow-lg"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending
          {pendingAdmins.length > 0 && (
            <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {pendingAdmins.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === "all"
              ? "bg-neutral-700 text-cyan-400 shadow-lg"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          All Admins ({allAdmins.length})
        </button>
      </div>

      {/* Pending Requests Tab */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingAdmins.length === 0 ? (
            <div className="bg-neutral-800/30 border border-neutral-800 rounded-xl p-12 text-center">
              <UserCheck className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-neutral-400 mb-1">No pending requests</h3>
              <p className="text-neutral-600 text-sm font-mono">All admin registrations have been processed.</p>
            </div>
          ) : (
            pendingAdmins.map((admin, index) => (
              <motion.div
                key={admin._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-5 flex items-center justify-between hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{admin.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-neutral-500 text-xs font-mono">
                        <Mail className="w-3 h-3" /> {admin.email}
                      </span>
                      <span className="flex items-center gap-1 text-neutral-500 text-xs font-mono">
                        <Calendar className="w-3 h-3" /> {formatDate(admin.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(admin._id)}
                    disabled={actionLoading === admin._id}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(admin._id)}
                    disabled={actionLoading === admin._id}
                    className="bg-red-600/80 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* All Admins Tab */}
      {activeTab === "all" && (
        <div className="bg-neutral-800/30 border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider px-5 py-3">Name</th>
                <th className="text-left text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider px-5 py-3">Email</th>
                <th className="text-left text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider px-5 py-3">Registered</th>
                <th className="text-left text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allAdmins.map((admin) => (
                <tr key={admin._id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-white">{admin.name}</td>
                  <td className="px-5 py-3.5 text-sm text-neutral-400 font-mono">{admin.email}</td>
                  <td className="px-5 py-3.5">{getStatusBadge(admin.status)}</td>
                  <td className="px-5 py-3.5 text-xs text-neutral-500 font-mono">{formatDate(admin.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    {admin.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(admin._id)}
                          disabled={actionLoading === admin._id}
                          className="text-emerald-400 hover:text-emerald-300 text-xs font-bold disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(admin._id)}
                          disabled={actionLoading === admin._id}
                          className="text-red-400 hover:text-red-300 text-xs font-bold disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {admin.status === "active" && (
                      <span className="text-neutral-600 text-xs font-mono">Verified ✓</span>
                    )}
                    {admin.status === "suspended" && (
                      <span className="text-neutral-600 text-xs font-mono">Rejected</span>
                    )}
                  </td>
                </tr>
              ))}
              {allAdmins.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-neutral-600 text-sm font-mono">
                    No admin accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
