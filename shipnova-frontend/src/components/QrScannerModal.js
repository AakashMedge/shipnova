"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZapOff } from "lucide-react";

/**
 * QrScannerModal
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onScanSuccess: (decodedText: string) => void
 *  - title: string
 *  - hint: string
 */
export default function QrScannerModal({ isOpen, onClose, onScanSuccess, title = "Scan QR Code", hint = "" }) {
  const scannerRef = useRef(null);
  const instanceRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  const stopScanner = async () => {
    if (instanceRef.current) {
      try {
        const state = instanceRef.current.getState?.();
        // State 2 = SCANNING
        if (state === 2) {
          await instanceRef.current.stop();
        }
      } catch (e) {
        // Ignore stop errors
      }
      instanceRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      // Dynamically import to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode");

      if (cancelled || !scannerRef.current) return;

      setError(null);
      setScanning(true);

      try {
        const scanner = new Html5Qrcode("qr-reader-container");
        instanceRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" }, // rear camera
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // SUCCESS — stop and fire callback
            stopScanner();
            onScanSuccess(decodedText);
          },
          () => {
            // Per-frame failure — ignore (normal while waiting)
          }
        );
      } catch (err) {
        if (cancelled) return;
        console.error("QR scanner error:", err);
        setError(
          err.message?.includes("Permission")
            ? "Camera permission denied. Please allow camera access in your browser settings."
            : `Camera unavailable: ${err.message}`
        );
        setScanning(false);
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
        >
          {/* Header */}
          <div className="w-full max-w-sm flex justify-between items-center mb-4">
            <div>
              <h2 className="text-white font-black text-lg tracking-tight">{title}</h2>
              {hint && (
                <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  {hint}
                </p>
              )}
            </div>
            <button
              onClick={() => { stopScanner(); onClose(); }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scanner Viewport */}
          <div className="relative w-full max-w-sm">
            {/* Corner bracket overlay — pure CSS */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              {/* Top-left */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
              {/* Top-right */}
              <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
              {/* Bottom-left */}
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
              {/* Bottom-right */}
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />
              {/* Scanning laser line */}
              {scanning && !error && (
                <motion.div
                  className="absolute left-6 right-6 h-0.5 bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]"
                  initial={{ top: "10%" }}
                  animate={{ top: ["10%", "88%", "10%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>

            {/* html5-qrcode mounts here */}
            <div
              id="qr-reader-container"
              ref={scannerRef}
              className="w-full rounded-3xl overflow-hidden bg-black"
              style={{ minHeight: 300 }}
            />

            {/* Error State */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-3xl p-6 text-center">
                <ZapOff className="w-10 h-10 text-red-400 mb-3" />
                <p className="text-white font-bold text-sm leading-relaxed">{error}</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center gap-2">
            {scanning && !error ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-neutral-300 text-xs font-bold uppercase tracking-widest">
                  Scanning…
                </span>
              </>
            ) : !error ? (
              <span className="text-neutral-500 text-xs font-bold">Initializing camera…</span>
            ) : null}
          </div>

          {/* Manual Fallback */}
          <div className="mt-6 w-full max-w-sm">
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest text-center mb-2">
              — or enter manually —
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = e.target.elements.manual.value.trim().toUpperCase();
                if (val) {
                  stopScanner();
                  onScanSuccess(val);
                  onClose();
                }
              }}
              className="flex gap-2"
            >
              <input
                name="manual"
                type="text"
                placeholder="Type code here…"
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-xs font-bold placeholder:text-neutral-500 outline-none focus:border-emerald-400 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-400 transition-colors"
              >
                Enter
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
