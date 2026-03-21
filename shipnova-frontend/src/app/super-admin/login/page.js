"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://shipnova-backend.vercel.app/api";

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in as Super Admin
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        if (parsed.role === "Super Admin") {
          router.push("/super-admin");
          return;
        }
      } catch (e) {}
    }
    setMounted(true);
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/super-admin/login`,
        { email, password },
        { timeout: 15000 }
      );
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data));
      router.push("/super-admin");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : `Unable to reach API at ${API_BASE_URL}`);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden font-sans selection:bg-cyan-500/20">
      
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glowing Orb Effects */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[100px]" />

      {/* Scan Lines Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
        }}
      />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px] mx-4"
      >
        {/* Top Security Bar */}
        <div className="flex items-center justify-between bg-[#111118] border border-neutral-800/50 rounded-t-xl px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-[0.2em]">
              Secure Channel
            </span>
          </div>
          <div className="text-[10px] font-mono text-neutral-600">
            TLS_AES_256_GCM
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-[#0d0d14] border border-neutral-800/50 border-t-0 rounded-b-xl p-8 sm:p-10 relative overflow-hidden">
          
          {/* Corner Accent Lines */}
          <div className="absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-cyan-500 to-transparent" />
          <div className="absolute top-0 left-0 w-[1px] h-16 bg-gradient-to-b from-cyan-500 to-transparent" />
          <div className="absolute bottom-0 right-0 w-16 h-[1px] bg-gradient-to-l from-purple-500 to-transparent" />
          <div className="absolute bottom-0 right-0 w-[1px] h-16 bg-gradient-to-t from-purple-500 to-transparent" />

          {/* Shield Icon */}
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-neutral-700/50 flex items-center justify-center backdrop-blur-sm">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-30" />
            </motion.div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
              System Administrator
            </h1>
            <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-[0.25em]">
              Privileged Access Terminal
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-[0.15em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
                Identifier
              </label>
              <input
                type="email"
                placeholder="admin@shipnova.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                className="w-full bg-[#0a0a10] border border-neutral-800 rounded-lg px-4 py-3 text-white text-sm font-mono placeholder:text-neutral-700 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-[0.15em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500/60" />
                Security Key
              </label>
              <input
                type="password"
                placeholder="••••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a10] border border-neutral-800 rounded-lg px-4 py-3 text-white text-sm font-mono placeholder:text-neutral-700 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-2.5"
              >
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-[11px] font-mono font-bold text-red-400 uppercase">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-sm font-bold py-3.5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Authenticate
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-neutral-800/50">
            <div className="flex items-center justify-between text-[9px] font-mono text-neutral-600 uppercase tracking-wider">
              <span>ShipNova Platform v2.0</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                System Online
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Particles (decorative) */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-500/20"
          initial={{
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
          }}
          animate={{
            y: [null, -20, 20, -10, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
