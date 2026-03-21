"use client";

import React, { useState } from "react";
import axios from "axios";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: "Company Admin",
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] px-4 py-12 md:py-16 flex items-center justify-center selection:bg-[#ff3399]/20">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }}
      />

      <div className="relative z-10 w-full max-w-xl bg-white border-4 border-black rounded-2xl p-7 md:p-10 shadow-[12px_12px_0_0_#2d66ff]">
        <div className="mb-8">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-black/45 mb-3">
            Company Admin Onboarding
          </p>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-black leading-none">
            Register
          </h1>
          <div className="h-2 w-16 bg-[#ff3399] mt-3" />
        </div>

        <form onSubmit={handleRegister} className="space-y-5" noValidate>
          <div>
            <label className="block font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/55 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full bg-white border-2 border-black/20 rounded-xl px-4 py-3 text-sm font-bold text-black outline-none focus:border-black focus:shadow-[4px_4px_0_0_#2d66ff]"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/55 mb-2">
              Work Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full bg-white border-2 border-black/20 rounded-xl px-4 py-3 text-sm font-bold text-black outline-none focus:border-black focus:shadow-[4px_4px_0_0_#2d66ff]"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/55 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="w-full bg-white border-2 border-black/20 rounded-xl px-4 py-3 text-sm font-bold text-black outline-none focus:border-black focus:shadow-[4px_4px_0_0_#2d66ff]"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/55 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              className="w-full bg-white border-2 border-black/20 rounded-xl px-4 py-3 text-sm font-bold text-black outline-none focus:border-black focus:shadow-[4px_4px_0_0_#2d66ff]"
              placeholder="Re-enter password"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/55 mb-2">
              Account Type
            </label>
            <input
              type="text"
              value="Company Admin"
              readOnly
              className="w-full bg-black/5 border-2 border-black/15 rounded-xl px-4 py-3 text-sm font-black text-black"
            />
          </div>

          {error && (
            <div className="p-3 border-2 border-red-500 bg-red-50 rounded-xl text-[11px] font-bold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 border-2 border-emerald-500 bg-emerald-50 rounded-xl text-[11px] font-bold text-emerald-700">
              Registration submitted. Your Company Admin account is pending Super Admin approval.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl border-2 border-black text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all ${
              loading
                ? "bg-black/70 cursor-not-allowed"
                : "bg-black shadow-[6px_6px_0_0_#ff3399] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5"
            }`}
          >
            {loading ? "Submitting..." : "Create Company Admin"}
          </button>
        </form>

        <div className="mt-7 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
          <Link href="/" className="hover:text-black">Back Home</Link>
          <Link href="/login" className="hover:text-[#2d66ff]">Go To Login</Link>
        </div>
      </div>
    </div>
  );
}
