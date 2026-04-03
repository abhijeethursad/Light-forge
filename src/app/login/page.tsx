"use client";

import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Activity, Lock, User, ChevronRight, Loader2 } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post("/api/auth/login", { username, password });
      toast.success("Access Granted", { 
        icon: '🟢', 
        style: { background: '#064e3b', color: '#fff', border: '1px solid #10b981' } 
      });
      window.location.href = "/"; // Instantly drops you into the Forge
    } catch (error) {
      toast.error("Access Denied");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-white">
      
      {/* --- AMBIENT ANIMATED BACKGROUND --- */}
      <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }}></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[60vw] h-[60vw] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }}></div>
      
      <Toaster position="top-center" toastOptions={{ style: { background: 'rgba(24, 24, 27, 0.95)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9999px', padding: '12px 24px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' } }} />

      {/* --- FORM CONTAINER --- */}
      <motion.form 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", bounce: 0, duration: 0.7 }}
        onSubmit={handleLogin} 
        className="w-full max-w-[380px] bg-zinc-950/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden"
      >
        {/* Subtle top edge highlight for 3D glass effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        <div className="flex flex-col items-center mb-10 mt-2">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="w-16 h-16 bg-white text-black rounded-[1.25rem] flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
          >
            <Activity className="w-8 h-8 stroke-[2.5]" />
          </motion.div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Light Forge</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1.5">Authorized Operatives Only</p>
        </div>

        <div className="space-y-4 mb-10">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-emerald-400 text-zinc-500">
              <User className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Username" 
              required 
              disabled={isLoading}
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all duration-300 disabled:opacity-50" 
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-emerald-400 text-zinc-500">
              <Lock className="w-5 h-5" />
            </div>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password" 
              required 
              disabled={isLoading}
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all duration-300 disabled:opacity-50" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !username || !password} 
          className="w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 font-black py-4 md:py-4.5 rounded-2xl transition-all duration-300 active:scale-[0.98] uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:shadow-none overflow-hidden relative"
        >
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              <span>Decrypting...</span>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex items-center gap-2"
            >
              Enter Matrix <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </motion.div>
          )}
        </button>
      </motion.form>
    </div>
  );
}