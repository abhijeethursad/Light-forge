"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play, CalendarDays, Plus, Activity, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import axios from "axios";

export default function SharedUI({ activeProfile }: { activeProfile: string }) {
  const pathname = usePathname();
  
  const handleLogout = async () => {
    await axios.post('/api/auth/logout');
    window.location.href = '/login';
  };

  const navItems = [
    { path: "/", label: "Workout", icon: <Play className="w-5 h-5 md:w-4 md:h-4" /> },
    { path: "/records", label: "Records", icon: <CalendarDays className="w-5 h-5 md:w-4 md:h-4" /> },
    { path: "/forge", label: "Forge", icon: <Plus className="w-5 h-5 md:w-4 md:h-4" /> },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 9999px; }
        input[type='number']::-webkit-inner-spin-button, input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type='number'] { -moz-appearance: textfield; padding: 0; }
        html, body { overscroll-behavior-x: none; }
      `}} />

      <div className="fixed top-0 left-1/4 w-[70vw] md:w-[50vw] h-[70vw] md:h-[50vw] rounded-full bg-indigo-900/15 blur-[60px] md:blur-[120px] pointer-events-none mix-blend-screen -z-10"></div>
      <Toaster position="top-center" toastOptions={{ style: { background: 'rgba(24, 24, 27, 0.95)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9999px' } }} />

      <header className="pt-6 pb-4 px-5 md:pt-8 md:pb-4 md:px-6 max-w-7xl mx-auto flex items-center justify-between relative z-[60] pointer-events-none">
        <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]"><Activity className="w-6 h-6 md:w-7 md:h-7 stroke-[2.5]" /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase leading-none">Light</h1>
            <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase leading-none mt-1.5">Forge System</p>
          </div>
        </div>

        {activeProfile && (
          <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
            {/* --- UPDATED: THIS IS NOW A CLICKABLE LINK --- */}
            <Link href="/profile" className="flex items-center gap-2 bg-[#09090b] border border-white/10 rounded-full p-1 sm:pr-4 shadow-lg hover:border-emerald-500/50 transition-all group active:scale-95">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xs md:text-sm uppercase shadow-inner group-hover:scale-105 transition-transform">{activeProfile.charAt(0)}</div>
              <span className="text-xs font-bold text-zinc-300 hidden sm:block group-hover:text-white transition-colors">{activeProfile}</span>
            </Link>
            
            <button onClick={handleLogout} className="bg-[#09090b] hover:bg-red-500/20 text-zinc-500 hover:text-red-500 p-2.5 md:p-3 rounded-full transition-colors border border-white/10 hover:border-red-500/30 shadow-lg flex items-center justify-center cursor-pointer">
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        )}
      </header>

      <div className={`fixed bottom-6 left-0 right-0 z-50 pointer-events-none flex justify-center px-6 md:bottom-auto md:top-6 md:px-0 transition-transform duration-500`}>
        <nav className="bg-[#09090b] border border-white/10 p-1.5 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.5)] pointer-events-auto flex gap-1 w-full md:w-auto justify-between md:justify-start">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`relative flex items-center justify-center gap-2 px-6 py-4 md:px-5 md:py-2.5 rounded-full font-bold text-sm transition-colors z-10 flex-1 md:flex-none ${isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                {isActive && <motion.div layoutId="dockBubble" className="absolute inset-0 bg-white/10 border border-white/10 rounded-full -z-10" transition={{ duration: 0.2 }} />}
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}