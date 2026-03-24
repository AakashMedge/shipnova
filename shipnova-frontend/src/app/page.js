"use client";

import React from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  const textReveal = {
    initial: { y: 100, opacity: 0 },
    whileInView: { y: 0, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: [0.6, 0.05, -0.01, 0.9] }
  };

  const [statusIndex, setStatusIndex] = React.useState(0);
  const statuses = ["Created", "Picked up", "Sorting", "In transit", "Out for delivery", "Delivered"];
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col items-center bg-[#fdfdfd] dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500 selection:bg-[#ff3399]/20 font-sans pb-0 overflow-x-hidden scroll-smooth">
      
      {/* --- Section 1: Navigation Header --- */}
      <nav className="sticky top-0 left-0 w-full z-[100] px-8 py-6 flex justify-between items-center backdrop-blur-md bg-white/70 dark:bg-[#0a0a0a]/70 border-b border-black/5 dark:border-white/5 transition-colors duration-500">
         <div className="text-2xl font-black italic tracking-tighter flex items-center gap-2 group cursor-pointer dark:text-white">
            <span className="bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-sm group-hover:bg-[#ff3399] dark:group-hover:bg-[#ff3399] dark:group-hover:text-white transition-colors">S</span>
            SHIPNOVA.
         </div>
         
         <div className="hidden lg:flex gap-10 font-mono text-sm uppercase tracking-[0.2em] font-black text-black/60 dark:text-white/60 items-center">
            <motion.a whileHover={{ scale: 1.1 }} href="#logistics" className="hover:text-black dark:hover:text-white transition-all relative group">
               Logistics
               <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff3399] group-hover:w-full transition-all duration-300"></span>
            </motion.a>
            <motion.a whileHover={{ scale: 1.1 }} href="#network" className="hover:text-black dark:hover:text-white transition-all relative group">
               Network
               <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff3399] group-hover:w-full transition-all duration-300"></span>
            </motion.a>
            <motion.a whileHover={{ scale: 1.1 }} href="#team" className="hover:text-black dark:hover:text-white transition-all relative group">
               Team
               <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff3399] group-hover:w-full transition-all duration-300"></span>
            </motion.a>
            <motion.a 
               href="#network" 
               className="text-[#ff3399] transition-all relative group drop-shadow-[0_0_8px_rgba(255,51,153,0.5)]"
               animate={{ opacity: [0.7, 1, 0.7] }}
               transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
               whileHover={{ scale: 1.1, dropShadow: "0px 0px 12px rgba(255,51,153,0.8)" }}
            >
               Network_Live
            </motion.a>
         </div>

         <div className="flex gap-4 items-center">
            <ThemeToggle />
            
            <a href="/login">
               <button className="hidden md:block text-[10px] font-black uppercase tracking-widest px-6 py-2.5 border-2 border-black dark:border-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all cursor-pointer">
                  LOGIN
               </button>
            </a>
            <a href="/register">
               <button className="text-[10px] font-black uppercase tracking-widest px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black shadow-[6px_6px_0_0_#ff3399] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all cursor-pointer">
                  GET STARTED
               </button>
            </a>
         </div>
      </nav>
      
      {/* Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')"}} />

      {/* --- Main Hero Section --- */}
      <div className="relative w-full min-h-screen max-w-[1400px] flex items-center justify-between px-8 md:px-16 z-10">
        
        {/* --- Left Side: Flight Path & Boxes --- */}
        <div className="relative flex items-center z-10 w-1/2">
          
          {/* Airplane & Flight Path (courier1.svg) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute -left-12 top-[-20%] w-[25vw] h-auto pointer-events-none z-10"
          >
             <img src="/homepage/courier1.svg" alt="Decoration" className="w-full h-auto opacity-80" />
          </motion.div>

          {/* Courier Boxes with modern hover tilt */}
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ y: -10, rotate: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="relative z-20 w-full max-w-[500px]"
          >
            <img 
              src="/homepage/courier.svg" 
              alt="Courier Boxes" 
              className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
            />
          </motion.div>
        </div>

        {/* --- Right Side: Staggered Typographic Block --- */}
        <div className="relative flex flex-col items-end text-black dark:text-white z-30 w-1/2 transition-colors duration-500">
          
          {/* Row 1: SMARTER */}
          <div className="relative group">
            <motion.div 
              initial={{ y: -20, opacity: 0, rotate: -5 }}
              animate={{ y: 0, opacity: 1, rotate: -10 }}
              transition={{ delay: 0.8 }}
              className="absolute -top-6 left-0 bg-[#2d66ff] text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full shadow-lg tracking-wider z-50 whitespace-nowrap"
            >
              SN-2026
            </motion.div>
            <div className="overflow-hidden">
              <motion.h1 
                {...textReveal}
                className="text-[10vw] md:text-[9rem] font-heavy font-black italic tracking-tighter leading-[0.82] hover:text-[#ff3399] transition-colors duration-300 cursor-default"
              >
                SMARTER
              </motion.h1>
            </div>
          </div>

          {/* Row 2: LOGISTICS */}
          <div className="relative group mt-2 md:mt-4 overflow-hidden">
            <motion.h1 
              {...textReveal}
              transition={{ ...textReveal.transition, delay: 0.1 }}
              className="text-[10vw] md:text-[9rem] font-heavy font-black tracking-tighter leading-[0.82] hover:text-[#ff3399] transition-colors duration-300 cursor-default"
            >
              LOGISTICS
            </motion.h1>
          </div>

          {/* Row 3: SHIPNOVA + THE PINK SCRIBBLE */}
          <div className="relative group mt-2 md:mt-4">
            
            {/* Pink Scribble Overlay */}
            <div className="absolute top-[-30%] right-[-10%] w-[15vw] h-[15vw] pointer-events-none z-40 opacity-90">
              <svg viewBox="0 0 200 200" className="w-full h-full stroke-[#eb308c] stroke-14 fill-none drop-shadow-md">
                  <motion.path 
                    initial={{ pathLength: 0 }} 
                    whileInView={{ pathLength: 1 }} 
                    transition={{ delay: 1, duration: 0.5 }}
                    d="M40,160 L160,40" 
                  />
                  <motion.path 
                    initial={{ pathLength: 0 }} 
                    whileInView={{ pathLength: 1 }} 
                    transition={{ delay: 1.2, duration: 0.5 }}
                    d="M40,40 L160,160" 
                  />
                  <motion.path 
                    initial={{ pathLength: 0 }} 
                    whileInView={{ pathLength: 1 }} 
                    transition={{ delay: 1.4, duration: 0.8 }}
                    d="M100,100 C160,40 180,120 100,170 C20,220 40,80 100,100" 
                  />
              </svg>
            </div>

            <motion.h1 
              {...textReveal}
              transition={{ ...textReveal.transition, delay: 0.2 }}
              className="text-[10vw] md:text-[9rem] font-heavy font-black tracking-tighter leading-[0.82] hover:text-[#ff3399] transition-colors duration-300 cursor-default"
            >
              SHIPNOVA
            </motion.h1>
          </div>
        </div>

      </div>

      {/* --- Duplicate Images Section (Untouched) --- */}
      <section className="relative w-full pt-12 pb-24 z-10 px-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-[1600px] mx-auto">
            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="relative group flex justify-center"
            >
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] md:w-[280px] h-auto z-50 pointer-events-none drop-shadow-xl">
                  <img src="/homepage/stip.svg" alt="Tape" className="w-full h-auto" />
               </div>
               <div className="relative w-full border-black border-4 shadow-[20px_20px_0_0_rgba(0,0,0,1)] overflow-hidden transition-all duration-500 hover:shadow-none hover:translate-x-[20px] hover:translate-y-[20px]">
                  <img src="/homepage/team_candid.png" alt="Community 1" className="w-full h-auto grayscale-[0.2] hover:grayscale-0 transition-all duration-700 block" />
               </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               className="relative group flex justify-center mt-24 md:mt-0"
            >
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] md:w-[280px] h-auto z-50 pointer-events-none drop-shadow-xl">
                  <img src="/homepage/stip.svg" alt="Tape" className="w-full h-auto" />
               </div>
               <div className="relative w-full border-black border-4 shadow-[20px_20px_0_0_#ff3399] overflow-hidden transition-all duration-500 hover:shadow-none hover:translate-x-[20px] hover:translate-y-[20px]">
                  <img src="/homepage/team_candid.png" alt="Community 2" className="w-full h-auto grayscale-[0.2] hover:grayscale-0 transition-all duration-700 block" />
               </div>
            </motion.div>
         </div>
      </section>

      {/* --- Section 5: Client Logos Marquee --- */}
      <section className="relative w-full py-16 overflow-hidden bg-black text-white z-10 border-y-4 border-[#ff3399]">
         <div className="flex whitespace-nowrap">
            <motion.div 
               animate={{ x: [0, -1920] }} 
               transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
               className="flex gap-32 items-center text-5xl md:text-7xl font-black italic tracking-tighter uppercase opacity-40 px-16"
            >
               <span>GLOBAL_EXPRESS</span>
               <div className="w-16 h-2 bg-[#ff3399]" />
               <span>SKYLINE_CARGO</span>
               <div className="w-16 h-2 bg-[#2d66ff]" />
               <span>SWIFT_LOGISTICS</span>
               <div className="w-16 h-2 bg-[#ffee33]" />
               <span>OCEANIC_NETWORK</span>
               <div className="w-16 h-2 bg-[#ff3399]" />
               <span>EURO_FREIGHT</span>
               <div className="w-16 h-2 bg-white" />
               <span>GLOBAL_EXPRESS</span>
               <div className="w-16 h-2 bg-[#ff3399]" />
               <span>SKYLINE_CARGO</span>
               <div className="w-16 h-2 bg-[#2d66ff]" />
               <span>SWIFT_LOGISTICS</span>
               <div className="w-16 h-2 bg-[#ffee33]" />
               <span>OCEANIC_NETWORK</span>
               <div className="w-16 h-2 bg-[#ff3399]" />
               <span>EURO_FREIGHT</span>
            </motion.div>
         </div>
         <div className="absolute top-2 left-8 font-mono text-[8px] uppercase tracking-widest text-[#ff3399]/50">Trusted_by_200+_Global_Enterprises</div>
      </section>

      {/* --- New Section: Future of Freight --- */}
      <section className="relative w-full py-24 px-8 md:px-16 z-10">
         <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start gap-12 md:gap-24">
            
            {/* Left Column: Bold Headline */}
            <div className="w-full md:w-1/3">
               <motion.h2 
                 initial={{ opacity: 0, x: -30 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="text-[4rem] md:text-[6rem] font-heavy font-black italic tracking-tighter leading-none text-black dark:text-white transition-colors duration-500"
               >
                  FUTURE OF<br/>FREIGHT.
               </motion.h2>
            </div>

            {/* Right Column: Body Text with Inline Badges */}
            <div className="w-full md:w-2/3 flex flex-col gap-8">
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="text-2xl md:text-3xl font-bold text-black/80 dark:text-white/80 transition-colors duration-500 leading-relaxed"
               >
                  After 
                  <span className="inline-block bg-[#ff3399]/15 border-[1.5px] border-[#ff3399] text-[#ff3399] text-xs font-black uppercase tracking-widest px-3 py-1 rounded-sm mx-2 -rotate-1 shadow-sm">2,000+ beta users</span> 
                  , a few late-night warehouse sessions, and more "last-mile" challenges than humanly necessary, we're officially taking the wheel.
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.1 }}
                 className="text-2xl md:text-3xl font-bold text-black/80 dark:text-white/80 transition-colors duration-500 leading-relaxed"
               >
                  But before we go full speed, we built the ultimate logistics dashboard — 
                  <span className="inline-block bg-[#ffee33] text-black text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-sm mx-2 italic shadow-md">because obviously.</span>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.2 }}
                 className="text-xl md:text-2xl font-semibold text-gray-500 dark:text-gray-400 transition-colors duration-500 leading-relaxed"
               >
                  This is our (deeply optimized) solution for the global shipping community. From spreadsheets that defied logic to routes that deserved a standing ovation, thank you for making this era of shipping possible.
               </motion.div>
            </div>
         </div>
      </section>

      {/* --- Section 2: Core Services --- */}
      <section id="logistics" className="relative w-full py-24 px-8 md:px-16 z-10 bg-[#f8f8f8]">
         <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
               <h2 className="text-[4rem] md:text-[6rem] font-black italic tracking-tighter leading-none text-black">
                  CORE<br/>SERVICES.
               </h2>
               <p className="max-w-[400px] font-mono text-sm text-gray-500 uppercase tracking-wider text-right">
                  Optimized for speed, built for reliability. We handle the heavy lifting so you don't have to.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                  { title: "AIR_CARGO", desc: "Next Day Delivery across continents with zero customs friction.", color: "#ff3399", icon: "MILE_01" },
                  { title: "SEA_FREIGHT", desc: "High-volume container shipping with real-time port telemetry.", color: "#2d66ff", icon: "MILE_02" },
                  { title: "INLAND_LOG", desc: "Automated truck dispatching for final-mile precision.", color: "#ffee33", icon: "MILE_03" }
               ].map((service, idx) => (idx === 0 || idx === 1 || idx === 2) && (
                  <motion.div 
                     key={idx}
                     whileHover={{ y: -10 }}
                     className="bg-white border-4 border-black p-10 flex flex-col gap-8 shadow-[12px_12px_0_0_#000] hover:shadow-none transition-all"
                  >
                     <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-bold px-2 py-1 bg-black text-white uppercase tracking-widest">{service.icon}</span>
                        <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center">
                           <div className="w-4 h-4" style={{ backgroundColor: service.color }} />
                        </div>
                     </div>
                     <h3 className="text-4xl font-black italic tracking-tighter">{service.title}</h3>
                     <p className="font-bold text-gray-500 leading-relaxed text-lg">{service.desc}</p>
                     <button className="mt-4 flex items-center gap-4 group font-black uppercase text-xs tracking-widest">
                        View Specs
                        <span className="group-hover:translate-x-2 transition-transform">→</span>
                     </button>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* --- Restored Section: To Our Team --- */}
      <section id="team" className="relative w-full py-24 px-8 md:px-16 z-10 border-t border-black/5">
         <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-24 relative">
            
            {/* Floating Rainbow Badge (Center) */}
            <motion.div 
               animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
               transition={{ repeat: Infinity, duration: 4 }}
               className="absolute left-1/2 md:left-[35%] top-0 md:top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-linear-to-tr from-[#ff3399] via-[#2d66ff] to-cyan-400 rounded shadow-xl opacity-80 z-20 pointer-events-none hidden md:block"
            />

            {/* Left Column: Bold Headline */}
            <div className="w-full md:w-1/3">
               <motion.h2 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 className="text-[4rem] md:text-[6rem] font-heavy font-black italic tracking-tighter leading-none text-black dark:text-white transition-colors duration-500 uppercase"
               >
                  TO OUR<br/>TEAM.
               </motion.h2>
            </div>

            {/* Right Column: Body Text with Inline Badges */}
            <div className="w-full md:w-2/3 flex flex-col gap-8">
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="text-2xl md:text-3xl font-bold text-black/80 dark:text-white/80 transition-colors duration-500 leading-relaxed"
               >
                  Thank you for being the kind of teammates who made this more than just work.
               </motion.div>

               <div className="text-xl md:text-2xl font-bold text-black/60 dark:text-white/60 transition-colors duration-500 leading-relaxed">
                  For every wild idea you said yes to, and every late-night route you helped shape — we're endlessly grateful. You taught us how to 
                  <span className="inline-block bg-[#ff3399] text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-sm mx-2 shadow-lg">lead with heart</span> 
                  , 
                  <span className="inline-block bg-[#2d66ff] text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-sm mx-2 shadow-lg">build with purpose</span> 
                  , and 
                  <span className="inline-block bg-[#ffef00] text-black text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-sm mx-2 shadow-lg">laugh</span> 
                  through the chaos.
               </div>

               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.3 }}
                 className="text-xl md:text-2xl font-bold text-black dark:text-white transition-colors duration-500 italic"
               >
                  We came to Shipnova to move freight. We stayed because of you.
               </motion.div>
            </div>
         </div>
      </section>

      {/* --- New Section: Metrics & Collaboration (Network) --- */}
      <section id="network" className="relative w-full py-48 px-8 overflow-hidden z-10 border-t border-black/5 bg-[#fcfcfc]">
         
         {/* Live Performance Cursors (Aesthetic) */}
         <motion.div 
            animate={{ 
               x: [100, 400, 200, 500, 100],
               y: [200, 100, 400, 300, 200]
            }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="absolute z-50 pointer-events-none flex flex-col items-start"
         >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#ff3399] fill-current drop-shadow-sm">
               <path d="M5.653 3.123l15.982 10.655l-7.991 1.998l3.996 7.493l-3.237 1.726l-3.996-7.493l-4.754 5.721z" />
            </svg>
            <span className="bg-[#ff3399] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg ml-3">DEV(ELOPER)IN</span>
         </motion.div>

         <motion.div 
            animate={{ 
               x: [800, 600, 900, 700, 800],
               y: [300, 500, 200, 400, 300]
            }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            className="absolute z-50 pointer-events-none flex flex-col items-start"
         >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#2d66ff] fill-current drop-shadow-sm">
               <path d="M5.653 3.123l15.982 10.655l-7.991 1.998l3.996 7.493l-3.237 1.726l-3.996-7.493l-4.754 5.721z" />
            </svg>
            <span className="bg-[#2d66ff] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg ml-3">BEN10</span>
         </motion.div>

         <div className="max-w-[1400px] mx-auto flex flex-col items-center gap-24 relative">
            
            <p className="font-mono text-[10px] md:text-xs text-black/40 tracking-[0.4em] uppercase">Metrics that move the world</p>

            {/* Main Metrics Column */}
            <div className="flex flex-col items-center gap-32 text-center">
               
               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                  <h4 className="text-[6rem] md:text-[8rem] font-heavy font-black italic tracking-tighter leading-none text-black">100K+</h4>
                  <p className="font-mono text-xs md:text-sm text-gray-500 uppercase tracking-widest mt-4">Shipments processed daily</p>
               </motion.div>

               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                  <h4 className="text-[6rem] md:text-[8rem] font-heavy font-black tracking-tighter leading-none text-black">99.8%</h4>
                  <p className="font-mono text-xs md:text-sm text-gray-500 uppercase tracking-widest mt-4">On-time delivery accuracy</p>
               </motion.div>

               {/* Real-time Tracking Status Cycle */}
               <div className="relative group p-12 border-2 border-black/10 border-dashed rounded-xl bg-white shadow-xs max-w-2xl w-full">
                  <div className="flex flex-col items-center gap-6">
                     <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 absolute -top-3 left-6">LIVE_STATUS_FEED</span>
                     
                     <div className="w-full flex flex-col items-center gap-8">
                        <motion.div 
                           key={statuses[statusIndex]}
                           initial={{ y: 20, opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           className="text-4xl md:text-6xl font-black italic tracking-tight text-[#ff3399]"
                        >
                           {statuses[statusIndex].toUpperCase()}
                        </motion.div>

                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden relative">
                           <motion.div 
                              animate={{ width: `${((statusIndex + 1) / statuses.length) * 100}%` }}
                              className="h-full bg-black transition-all duration-700 ease-in-out"
                           />
                        </div>

                        <div className="flex justify-between w-full font-mono text-[10px] text-gray-400">
                           <span>ORIGIN: LON</span>
                           <span>DEST: NYC</span>
                        </div>
                     </div>
                  </div>
               </div>

               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                  <h4 className="text-[6rem] md:text-[8rem] font-heavy font-black italic tracking-tighter leading-none text-black hover:text-[#2d66ff] transition-colors cursor-default">24/7</h4>
                  <p className="font-mono text-xs md:text-sm text-gray-500 uppercase tracking-widest mt-4">Automated local sorting</p>
               </motion.div>
            </div>

            {/* Scattered Scrap notes like the screenshot */}
            <motion.div 
               drag
               className="absolute top-[10%] -left-12 bg-white/80 p-6 shadow-xl border-t-8 border-black -rotate-6 cursor-grab max-w-[200px] hidden lg:block"
            >
               <h5 className="font-bold text-xs underline mb-2 italic">NOTE_2026:</h5>
               <p className="text-xs font-medium text-black/60 font-mono italic">"Tiny but Mighty — Our sorting algorithm just broke 1.2s per parcel. Because obviously."</p>
            </motion.div>

            <motion.div 
               drag
               className="absolute bottom-[20%] -right-12 bg-[#ffee33] p-4 shadow-xl rotate-12 cursor-grab hidden lg:block"
            >
               <span className="font-black text-sm uppercase tracking-tighter">Live Traffic Override</span>
            </motion.div>

         </div>
      </section>

      {/* --- Section 4: FAQ Section --- */}
      <section className="relative w-full py-32 px-8 z-10 overflow-hidden">
         <div className="max-w-[1000px] mx-auto relative">
            
            {/* Hand-drawn scribble accent */}
            <div className="absolute -top-12 -left-24 w-48 h-48 opacity-10 pointer-events-none rotate-12">
               <svg viewBox="0 0 200 200" className="w-full h-full stroke-black stroke-2 fill-none">
                  <path d="M20,100 C20,100 80,20 100,100 C120,180 180,100 180,100" />
                  <circle cx="100" cy="100" r="80" strokeDasharray="10,10" />
               </svg>
            </div>

            <div className="text-center mb-24">
               <h2 className="text-[3rem] md:text-[5rem] font-black italic tracking-tighter leading-none mb-4">GOT QUESTIONS?</h2>
               <p className="font-mono text-xs text-gray-400 uppercase tracking-widest italic">Wait... people actually read these?</p>
            </div>

            <div className="space-y-6">
               {[
                  { q: "How fast is 'Fast'?", a: "We aim for under 24 hours for local delivery. If we're late, the CEO personally apologizes (not really, but we try)." },
                  { q: "Do you ship to the moon?", a: "Not yet. But we're optimized for every major continent and most of the minor ones too." },
                  { q: "What's the 'Bag' section for?", a: "It's a digital workspace for our team to scatter their best memories. It's heart, not just freight." },
                  { q: "Is tracking actually real-time?", a: "100%. Our telemetry updates every 15 seconds. No more 'Shipment received' limbo." }
               ].map((item, idx) => (
                  <details key={idx} className="group border-b-2 border-black pb-6 cursor-pointer">
                     <summary className="list-none flex justify-between items-center text-2xl font-black italic tracking-tight group-hover:text-[#ff3399] transition-colors">
                        {item.q.toUpperCase()}
                        <span className="text-4xl group-open:rotate-45 transition-transform duration-300 transition-colors">+</span>
                     </summary>
                     <p className="mt-4 font-bold text-gray-600 leading-relaxed text-lg max-w-[800px]">
                        {item.a}
                     </p>
                  </details>
               ))}
            </div>
         </div>
      </section>

      {/* --- Final Section: Interactive Scattered Photos --- */}
      <section className="relative w-full py-48 px-4 md:px-8 overflow-hidden z-20">
         <div className="max-w-[1500px] mx-auto min-h-[700px] relative flex items-center justify-center">
            
            {/* Background Texture Overlay */}
            <h3 className="absolute bottom-20 right-10 text-[10vw] font-heavy text-black opacity-[0.02] pointer-events-none select-none italic -rotate-12">
               SHIPNOVA BAG
            </h3>

            {/* --- Left Side: 3 Photos --- */}
            {/* Photo 1 (Top Left) */}
            <motion.div 
               drag
               whileDrag={{ zIndex: 100, scale: 1.05 }}
               dragElastic={0.1}
               className="absolute top-[5%] left-[5%] md:left-[10%] w-40 md:w-56 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.1)] -rotate-6 cursor-grab active:cursor-grabbing"
            >
               <img src="/homepage/team_candid.png" alt="Mem 1" className="w-full aspect-square object-cover pointer-events-none" />
               <p className="mt-2 text-center font-mono text-[10px] text-gray-400">#01_CASUAL</p>
            </motion.div>

            {/* Photo 2 (Mid Left) */}
            <motion.div 
               drag
               whileDrag={{ zIndex: 100, scale: 1.05 }}
               dragElastic={0.1}
               className="absolute top-[40%] left-[2%] md:left-[4%] w-44 md:w-60 bg-white p-2 shadow-[0_15px_40px_rgba(0,0,0,0.15)] rotate-12 cursor-grab active:cursor-grabbing"
            >
               <img src="/homepage/team_candid.png" alt="Mem 2" className="w-full aspect-square object-cover pointer-events-none" />
               <p className="mt-2 text-center font-mono text-[10px] text-gray-400">#02_LATE_NIGHT</p>
            </motion.div>

            {/* Photo 3 (Bottom Left) */}
            <motion.div 
               drag
               whileDrag={{ zIndex: 100, scale: 1.05 }}
               dragElastic={0.1}
               className="absolute bottom-[5%] left-[8%] md:left-[12%] w-40 md:w-52 bg-white p-2 shadow-[0_5px_25px_rgba(0,0,0,0.08)] -rotate-3 cursor-grab active:cursor-grabbing"
            >
               <img src="/homepage/team_candid.png" alt="Mem 3" className="w-full aspect-square object-cover pointer-events-none" />
               <p className="mt-2 text-center font-mono text-[10px] text-gray-400">#03_LAUNCH_DAY</p>
            </motion.div>

            {/* --- Right Side: 3 Photos --- */}
            {/* Photo 4 (Top Right) */}
            <motion.div 
               drag
               whileDrag={{ zIndex: 100, scale: 1.05 }}
               dragElastic={0.1}
               className="absolute top-[8%] right-[5%] md:right-[10%] w-42 md:w-56 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.1)] rotate-5 cursor-grab active:cursor-grabbing"
            >
               <img src="/homepage/team_candid.png" alt="Mem 4" className="w-full aspect-square object-cover pointer-events-none" />
               <p className="mt-2 text-center font-mono text-[10px] text-gray-400">#04_WORKSHOP</p>
            </motion.div>

            {/* Photo 5 (Mid Right) */}
            <motion.div 
               drag
               whileDrag={{ zIndex: 100, scale: 1.05 }}
               dragElastic={0.1}
               className="absolute top-[45%] right-[2%] md:right-[6%] w-40 md:w-52 bg-white p-2 shadow-[0_15px_45px_rgba(0,0,0,0.18)] -rotate-12 cursor-grab active:cursor-grabbing"
            >
               <img src="/homepage/team_candid.png" alt="Mem 5" className="w-full aspect-square object-cover pointer-events-none" />
               <p className="mt-2 text-center font-mono text-[10px] text-gray-400">#05_TEAM_BONDING</p>
            </motion.div>

            {/* Photo 6 (Bottom Right) */}
            <motion.div 
               drag
               whileDrag={{ zIndex: 100, scale: 1.05 }}
               dragElastic={0.1}
               className="absolute bottom-[8%] right-[10%] md:right-[15%] w-44 md:w-60 bg-white p-2 shadow-[0_10px_35px_rgba(0,0,0,0.12)] rotate-2 cursor-grab active:cursor-grabbing"
            >
               <img src="/homepage/team_candid.png" alt="Mem 6" className="w-full aspect-square object-cover pointer-events-none" />
               <p className="mt-2 text-center font-mono text-[10px] text-gray-400">#06_FINAL_SITE</p>
            </motion.div>

            {/* --- Main Center Item: The Black Bag (Smooth Momentum Drag) --- */}
            <motion.div 
               drag
               dragTransition={{ power: 0.2, timeConstant: 200 }}
               whileDrag={{ zIndex: 100, scale: 1.01 }}
               initial={{ scale: 0.9, opacity: 0 }}
               whileInView={{ scale: 1, opacity: 1 }}
               viewport={{ once: true }}
               className="relative z-30 w-72 md:w-[550px] cursor-grab active:cursor-grabbing"
            >
               <img 
                 src="https://cdn.prod.website-files.com/684243f1563d71aee92b4762/684243f1563d71aee92b486e_webflow-bag.avif" 
                 alt="Tote bag" 
                 className="w-full h-auto drop-shadow-[0_50px_100px_rgba(0,0,0,0.3)] pointer-events-none"
               />
               
               <motion.span 
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.6em] text-gray-400 whitespace-nowrap"
               >
               </motion.span>
            </motion.div>

         </div>
      </section>

      {/* --- Section 8: Farewell & Signature --- */}
      <section className="relative w-full py-48 px-8 overflow-hidden z-10 bg-[#fdfdfd] border-t border-black/5">
         <div className="max-w-[1400px] mx-auto min-h-[600px] relative flex flex-col items-center justify-center">
            
            {/* Centered Farewell Text */}
            <motion.h4 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="font-mono text-xs md:text-sm font-black tracking-[0.5em] text-black/40 mb-12 uppercase text-center"
            >
               UNTIL WE MEET AGAIN.
            </motion.h4>

            {/* Large Shipnova Signature (SVG) */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 1, ease: "easeOut" }}
               className="relative z-20 w-fit"
            >
               <img 
                  src="/homepage/shipnova.svg" 
                  alt="Shipnova Signature" 
                  className="w-[400px] md:w-[800px] h-auto drop-shadow-sm mix-blend-multiply opacity-90"
               />
            </motion.div>

            {/* --- Scattered Polaroid Memories (Around the signature) --- */}
            {/* Top Left */}
            <motion.div 
               drag
               initial={{ x: -200, y: -100, opacity: 0, rotate: -15 }}
               whileInView={{ x: -150, y: -180, opacity: 1 }}
               viewport={{ once: true }}
               className="absolute z-10 w-32 md:w-56 bg-white p-2 shadow-xl border border-black/5 -rotate-6 cursor-grab max-w-[200px] hidden md:block"
            >
               <img src="/homepage/team_candid.png" alt="Mem 7" className="w-full aspect-square object-cover pointer-events-none" />
               <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-24">
                  <img src="/homepage/stip.svg" alt="Tape" className="w-full h-auto opacity-40" />
               </div>
            </motion.div>

            {/* Bottom Right */}
            <motion.div 
               drag
               initial={{ x: 200, y: 100, opacity: 0, rotate: 15 }}
               whileInView={{ x: 250, y: 150, opacity: 1 }}
               viewport={{ once: true }}
               className="absolute z-10 w-32 md:w-64 bg-white p-2 shadow-2xl border border-black/5 rotate-12 cursor-grab hidden md:block"
            >
               <img src="/homepage/team_candid.png" alt="Mem 8" className="w-full aspect-square object-cover pointer-events-none" />
            </motion.div>

            {/* Bottom Left Small */}
            <motion.div 
               drag
               initial={{ x: -300, y: 150, opacity: 0 }}
               whileInView={{ x: -280, y: 50, opacity: 1 }}
               viewport={{ once: true }}
               className="absolute z-10 w-24 md:w-48 bg-white p-2 shadow-lg border border-black/5 rotate-3 cursor-grab hidden md:block"
            >
               <img src="/homepage/team_candid.png" alt="Mem 9" className="w-full aspect-[4/3] object-cover pointer-events-none" />
            </motion.div>

            {/* Top Right Tiny */}
            <motion.div 
               drag
               initial={{ x: 300, y: -150, opacity: 0 }}
               whileInView={{ x: 220, y: -120, opacity: 1 }}
               viewport={{ once: true }}
               className="absolute z-10 w-20 md:w-40 bg-white p-2 shadow-md border border-black/5 -rotate-12 cursor-grab hidden md:block"
            >
               <img src="/homepage/team_candid.png" alt="Mem 10" className="w-full aspect-square object-cover pointer-events-none" />
            </motion.div>
         </div>
      </section>

      {/* --- Section 6: Final Call to Action (CTA) --- */}
      <section className="relative w-full py-48 px-8 z-10 bg-black text-white overflow-hidden">
         {/* Background Elements */}
         <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')"}} />
         <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] border-[1px] border-white/10 rounded-full"
         />

         <div className="max-w-[1400px] mx-auto text-center relative z-20">
            <motion.h2 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="text-[6vw] md:text-[10rem] font-black italic tracking-tighter leading-none mb-12"
            >
               READY TO<br/>MOVE?
            </motion.h2>
            <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
               <a href="/register">
                  <motion.button 
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     className="text-xl font-black uppercase tracking-widest px-12 py-6 bg-[#ff3399] text-white shadow-[10px_10px_0_0_#fff] hover:shadow-none hover:translate-x-[10px] hover:translate-y-[10px] transition-all cursor-pointer"
                  >
                     GET STARTED NOW
                  </motion.button>
               </a>
               <button className="text-xl font-black uppercase tracking-widest px-12 py-6 border-2 border-white hover:bg-white hover:text-black transition-all cursor-pointer">
                  CONTACT SALES
               </button>
            </div>
            <p className="mt-16 font-mono text-sm uppercase tracking-[0.4em] opacity-50">
               Join 2,000+ companies optimizing with Shipnova.
            </p>
         </div>
      </section>

      {/* --- Section 7: Footer --- */}
      <footer className="relative w-full py-24 px-8 md:px-16 z-10 bg-[#fdfdfd] border-t-2 border-black">
         <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-24">
            
            {/* Branding */}
            <div className="flex flex-col gap-8 col-span-1 md:col-span-1">
               <div className="text-3xl font-black italic tracking-tighter">SHIPNOVA.</div>
               <p className="font-bold text-gray-500 leading-relaxed">
                  The future of global freight, built for the digital age. Heart, soul, and a lot of caffeine.
               </p>
               <div className="flex gap-4">
                  {['Twitter', 'LinkedIn', 'Instagram'].map(social => (
                     <div key={social} className="w-10 h-10 border-2 border-black flex items-center justify-center font-black text-[8px] uppercase cursor-pointer hover:bg-black hover:text-white transition-all">
                        {social[0]}
                     </div>
                  ))}
               </div>
            </div>

            {/* Links Columns */}
            {[
               { title: "Product", links: ["Tracking", "Services", "Pricing", "API"] },
               { title: "Company", links: ["Team", "Journal", "Careers", "Contact"] },
               { title: "Legal", links: ["Privacy", "Terms", "Cookies", "License"] }
            ].map((col, idx) => (
               <div key={idx} className="flex flex-col gap-8">
                  <h4 className="font-mono text-xs font-black uppercase tracking-widest text-[#ff3399]">{col.title}</h4>
                  <ul className="flex flex-col gap-4 font-bold text-black/60">
                     {col.links.map(link => (
                        <li key={link} className="hover:text-black hover:translate-x-2 transition-all cursor-pointer">
                           {link}
                        </li>
                     ))}
                  </ul>
               </div>
            ))}
         </div>

         <div className="max-w-[1400px] mx-auto mt-24 pt-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
               © 2026 SHIPNOVA LOGISTICS INC. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-4 text-[10px] font-black italic tracking-widest text-black/20">
               <span>BUILT_WITH_HEART</span>
               <div className="w-1 h-1 bg-black/10 rounded-full" />
               <span>EST_2026</span>
               <div className="w-1 h-1 bg-black/10 rounded-full" />
               <span>GLOBAL_OPS</span>
            </div>
         </div>
      </footer>
    </div>
  );
}

