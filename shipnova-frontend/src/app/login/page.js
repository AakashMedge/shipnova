"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Building2, Truck, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://shipnova-backend.vercel.app/api";

// ─── Role Definitions ─────────────────────────────────────────────────────────
const ROLES = [
  {
    id: "admin",
    label: "Company Admin",
    subtitle: "Manage shipments, hubs & agents",
    icon: Building2,
    gradient: "from-black to-black",
    pill: "bg-black text-white border-black",
    cardShadow: "shadow-[10px_10px_0_0_#2d66ff]",
    canRegister: false,
    tagline: "Company Portal",
  },
  {
    id: "agent",
    label: "Delivery Agent",
    subtitle: "Update deliveries & upload proof",
    icon: Truck,
    gradient: "from-[#2d66ff] to-[#1d4ed8]",
    pill: "bg-[#2d66ff] text-white border-[#2d66ff]",
    cardShadow: "shadow-[10px_10px_0_0_#ff3399]",
    canRegister: false,
    tagline: "Field Operations",
  },
  {
    id: "hubmanager",
    label: "Hub Manager",
    subtitle: "Manage incoming and outgoing parcels",
    icon: Building2,
    gradient: "from-[#ff3399] to-[#db2777]",
    pill: "bg-[#ff3399] text-white border-[#ff3399]",
    cardShadow: "shadow-[10px_10px_0_0_#000]",
    canRegister: false,
    tagline: "Sorting Facility",
  },
];

// ─── Password Strength ─────────────────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak", pct: "25%", color: "bg-red-400", textColor: "text-red-500" };
  if (score <= 2) return { label: "Fair", pct: "50%", color: "bg-amber-400", textColor: "text-amber-500" };
  if (score <= 3) return { label: "Good", pct: "75%", color: "bg-indigo-500", textColor: "text-indigo-600" };
  return { label: "Strong", pct: "100%", color: "bg-emerald-500", textColor: "text-emerald-600" };
}

// ─── Map API errors to friendly messages ──────────────────────────────────────
function mapError(message) {
  if (!message) return "Something went wrong. Please try again.";
  const msg = message.toLowerCase();
  if (msg.includes("user already exists")) return "ACCOUNT_EXISTS";
  if (msg.includes("invalid credentials") || msg.includes("password")) return "Wrong email or password.";
  if (msg.includes("not found")) return "No account found with this email.";
  if (msg.includes("pending")) return "Your account is awaiting Super Admin approval.";
  return message;
}

// ─── Shake animation ──────────────────────────────────────────────────────────
const shakeVariant = {
  shake: { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4 } },
  idle:  { x: 0 },
};

// ─── Field Component (MUST be outside parent to prevent focus loss) ───────────
// Defining this inside the parent causes it to remount on every keystroke.
function FormField({ id, label, type, value, onChange, placeholder, error, rightEl }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-black/55 dark:text-white/55 transition-colors duration-500 ml-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-white dark:bg-[#111] border-2 rounded-xl px-5 py-4 pr-14 text-black dark:text-white font-bold outline-none transition-all placeholder:text-black/30 dark:placeholder:text-white/30 text-sm
            ${error ? "border-red-500 bg-red-50/60" : "border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white focus:shadow-[4px_4px_0_0_#2d66ff]"}`}
        />
        {rightEl && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="text-[10px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5 ml-1 overflow-hidden"
          >
            <AlertCircle className="w-3 h-3 shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function LoginGateway() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [suggestRegister, setSuggestRegister] = useState(false);
  const router = useRouter();

  const currentRole = ROLES.find((r) => r.id === selectedRole);
  const passwordStrength = getPasswordStrength(formData.password);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }, []);

  const validate = () => {
    const e = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (mode === "register" && (!formData.name || formData.name.trim().length < 2))
      e.name = "Name must be at least 2 characters.";
    if (!formData.email || !emailRegex.test(formData.email))
      e.email = "Please enter a valid email address.";
    if (!formData.password || formData.password.length < (mode === "register" ? 8 : 6))
      e.password = mode === "register" ? "Password must be at least 8 characters." : "Password must be at least 6 characters.";
    if (mode === "register" && formData.password !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuggestRegister(false);
    setApiError(null);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      triggerShake();
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        const res = await axios.post(
          `${API_BASE_URL}/auth/login`,
          { email: formData.email, password: formData.password },
          { timeout: 15000 }
        );
        data = res.data;
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/auth/register`,
          { name: formData.name, email: formData.email, password: formData.password, role: "Customer" },
          { timeout: 15000 }
        );
        data = res.data;
      }
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data));
      if (data.role === "Company Admin") router.push("/admin");
      else if (data.role === "Agent") router.push("/agent");
      else if (data.role === "Hub Manager") router.push("/hub-manager");
      else router.push("/dashboard");
    } catch (err) {
      const rawMsg =
        err.response?.data?.message ||
        (err.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : `Unable to reach API at ${API_BASE_URL}`);
      const mapped = mapError(rawMsg);
      triggerShake();
      if (mapped === "ACCOUNT_EXISTS") {
        setApiError("An account with this email already exists.");
      } else {
        setApiError(mapped);
        if (selectedRole === "customer" && mode === "login" && rawMsg.toLowerCase().includes("invalid")) {
          setSuggestRegister(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setMode("login");
    setErrors({});
    setApiError(null);
    setSuggestRegister(false);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setApiError(null);
    setSuggestRegister(false);
    setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
  };

  // ─── Handlers that don't cause re-render of FormField ─────────────────────
  const handleNameChange = (e) => { setFormData((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: null })); };
  const handleEmailChange = (e) => { setFormData((p) => ({ ...p, email: e.target.value.toLowerCase() })); setErrors((p) => ({ ...p, email: null })); setSuggestRegister(false); };
  const handlePasswordChange = (e) => { setFormData((p) => ({ ...p, password: e.target.value })); setErrors((p) => ({ ...p, password: null })); };
  const handleConfirmChange = (e) => { setFormData((p) => ({ ...p, confirmPassword: e.target.value })); setErrors((p) => ({ ...p, confirmPassword: null })); };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen relative bg-[#fdfdfd] dark:bg-[#0a0a0a] transition-colors duration-500 flex items-center justify-center p-4 md:p-8 font-sans selection:bg-[#ff3399]/20 overflow-hidden">
      <div className="absolute top-6 right-8 z-50"><ThemeToggle /></div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }} />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-[#ff3399]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-[#2d66ff]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">

        <AnimatePresence mode="wait">

          {/* ── Phase 1: Role Gateway ──────────────────────────────────────── */}
          {!selectedRole && (
            <motion.div
              key="gateway"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              <div className="text-center mb-16">
                <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                  <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center group-hover:bg-[#ff3399] dark:group-hover:bg-[#ff3399] dark:group-hover:text-white transition-colors">
                    <span className="font-black italic text-lg leading-none">S</span>
                  </div>
                  <span className="text-xl font-black italic tracking-tighter text-black dark:text-white transition-colors">SHIPNOVA.</span>
                </Link>
                <h1 className="text-5xl md:text-7xl font-heavy italic text-black dark:text-white transition-colors mb-4">Welcome Back</h1>
                <p className="font-mono text-xs md:text-sm uppercase tracking-[0.2em] text-black/50 dark:text-white/50 transition-colors">Select your portal to continue</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {ROLES.map((role, i) => (
                  <motion.button
                    key={role.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedRole(role.id)}
                    className={`group relative bg-white dark:bg-[#111] border-4 border-black dark:border-white/10 rounded-2xl p-8 text-left transition-all duration-300 overflow-hidden ${role.cardShadow} hover:shadow-none hover:translate-x-2.5 hover:translate-y-2.5`}
                  >
                    <div className="absolute inset-0 bg-linear-to-br from-black/1.5 to-transparent pointer-events-none" />
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 border-2 ${role.pill}`}>
                      <role.icon className="w-7 h-7" />
                    </div>
                    <div className="mb-4">
                      <span className="font-mono text-[9px] font-black uppercase tracking-[0.25em] text-black/50 dark:text-white/50">{role.tagline}</span>
                    </div>
                    <h3 className="text-4xl md:text-[2.6rem] font-black italic tracking-tighter text-black dark:text-white mt-2 mb-2 leading-none group-hover:text-[#ff3399] dark:group-hover:text-[#ff3399] transition-colors">{role.label}</h3>
                    <p className="text-black/60 dark:text-white/60 text-sm font-bold leading-relaxed mb-8 transition-colors">{role.subtitle}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 dark:text-white/40">
                        {role.canRegister ? "Login or Register" : "Login Only"}
                      </span>
                      <div className="w-10 h-10 border-2 border-black dark:border-white/30 rounded-xl flex items-center justify-center text-black dark:text-white group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-300">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="text-center space-y-3">
                <p className="text-[10px] text-black/35 font-black uppercase tracking-[0.3em]">
                  Need a new company admin account?
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#2d66ff] hover:text-[#ff3399]"
                >
                  Register Company Admin
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <p className="text-[10px] text-black/40 font-bold uppercase tracking-[0.2em]">
                  Agent and Hub Manager accounts are created internally.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Phase 2: Form ─────────────────────────────────────────────── */}
          {selectedRole && currentRole && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
              className="max-w-md mx-auto"
            >
              <button onClick={handleBack} className="flex items-center gap-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors mb-8 font-mono font-black uppercase tracking-[0.2em] text-[11px] group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                All Portals
              </button>

              <motion.div
                animate={isShaking ? "shake" : "idle"}
                variants={shakeVariant}
                className={`bg-white dark:bg-[#111] border-4 border-black dark:border-white/10 rounded-2xl p-8 md:p-10 transition-colors duration-500 ${currentRole.cardShadow}`}
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-black/10 dark:border-white/10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${currentRole.pill}`}>
                    <currentRole.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.25em] text-black/50 dark:text-white/50">{currentRole.tagline}</p>
                    <h2 className="text-3xl font-black italic tracking-tighter text-black dark:text-white leading-none mt-2">{currentRole.label}</h2>
                  </div>
                </div>

                {/* Mode toggle (Customer only) */}
                {currentRole.canRegister && (
                  <div className="flex bg-black/5 dark:bg-white/5 border-2 border-black/15 dark:border-white/15 p-1.5 rounded-xl mb-8">
                    {["login", "register"].map((m) => (
                      <button key={m} onClick={() => switchMode(m)}
                        className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/45 dark:text-white/45 hover:text-black dark:hover:text-white"}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                  {/* Name field — Register only */}
                  <AnimatePresence>
                    {mode === "register" && (
                      <motion.div key="name" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <FormField id="name" label="Full Name" type="text" value={formData.name} onChange={handleNameChange} placeholder="Your full name" error={errors.name} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <FormField id="email" label="Email Address" type="email" value={formData.email} onChange={handleEmailChange} placeholder="you@email.com" error={errors.email} />

                  <FormField
                    id="password" label="Password"
                    type={showPass ? "text" : "password"}
                    value={formData.password} onChange={handlePasswordChange}
                    placeholder="••••••••" error={errors.password}
                    rightEl={
                      <button type="button" onClick={() => setShowPass(!showPass)} className="text-black/35 dark:text-white/35 hover:text-black dark:hover:text-white transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* Password strength — Register only */}
                  <AnimatePresence>
                    {mode === "register" && formData.password && passwordStrength && (
                      <motion.div key="strength" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5 overflow-hidden">
                        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5">
                          <motion.div className={`h-1.5 rounded-full ${passwordStrength.color} transition-all duration-500`} style={{ width: passwordStrength.pct }} />
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${passwordStrength.textColor}`}>{passwordStrength.label} Password</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Confirm password — Register only */}
                  <AnimatePresence>
                    {mode === "register" && (
                      <motion.div key="confirm" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <FormField
                          id="confirmPassword" label="Confirm Password"
                          type={showConfirm ? "text" : "password"}
                          value={formData.confirmPassword} onChange={handleConfirmChange}
                          placeholder="Re-enter password" error={errors.confirmPassword}
                          rightEl={
                            <div className="flex items-center gap-2">
                              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              )}
                              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-black/35 dark:text-white/35 hover:text-black dark:hover:text-white transition-colors">
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* API Error */}
                  <AnimatePresence>
                    {apiError && (
                      <motion.div key="apierr" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-4 bg-red-50 border-2 border-red-500 rounded-xl space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" /> {apiError}
                        </p>
                        {suggestRegister && currentRole.canRegister && (
                          <button type="button" onClick={() => switchMode("register")}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2d66ff] hover:underline flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> Create an Account Instead
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button type="submit" disabled={loading}
                    className={`w-full py-5 bg-linear-to-r ${currentRole.gradient} text-white font-black uppercase tracking-[0.25em] text-[11px] rounded-xl border-2 border-black transition-all flex items-center justify-center gap-3
                        ${loading ? "opacity-70 cursor-not-allowed" : "shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 active:scale-95"}`}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
                      : mode === "login" ? `Access ${currentRole.label} Portal →` : "Create Account →"
                    }
                  </button>
                </form>

                <p className="text-center text-[10px] text-black/35 dark:text-white/35 font-black uppercase tracking-[0.2em] mt-8 leading-relaxed">
                  {mode === "login"
                    ? currentRole.canRegister ? "New here? Use the Register tab above." : "Accounts are provisioned by your company admin."
                    : "Already registered? Use the Login tab above."}
                </p>
              </motion.div>

              <p className="text-center text-[10px] text-black/35 dark:text-white/35 font-black uppercase tracking-[0.2em] mt-8">
                Shipnova — Multi-Tenant Courier SaaS
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
