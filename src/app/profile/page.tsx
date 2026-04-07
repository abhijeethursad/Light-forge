"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Dumbbell, Activity, ShieldCheck, Zap, BarChart2, ChevronRight } from "lucide-react";
import SharedUI from "@/components/SharedUI";
import ExerciseHistoryModal from "@/components/ExerciseHistoryModal";
import { useAuthAndData, allMuscleGroups, ExerciseDef } from "@/lib/store";

// Static thumbnail to keep the accordions lag-free
const ProfileThumbnail = ({ videoUrl }: { videoUrl?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handleMouseEnter = () => { if (window.innerWidth > 768 && videoRef.current) videoRef.current.play().catch(() => {}); };
  const handleMouseLeave = () => { if (window.innerWidth > 768 && videoRef.current) videoRef.current.pause(); };

  if (!videoUrl) return (
    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl border border-white/10 bg-zinc-900/50 flex items-center justify-center flex-shrink-0">
      <Dumbbell className="w-4 h-4 text-zinc-600" />
    </div>
  );

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden border border-white/10 bg-zinc-950 flex-shrink-0 relative group shadow-lg">
      <video ref={videoRef} src={videoUrl} loop muted playsInline preload="metadata" className="w-full h-full object-cover opacity-80" />
    </div>
  );
};

export default function ProfilePage() {
  const { activeProfile, library, logs } = useAuthAndData();
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  
  // Modal State
  const [selectedEx, setSelectedEx] = useState<ExerciseDef | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- STATS CALCULATION ---
  const totalSets = logs.length;
  const totalVolume = logs.reduce((sum, set) => {
    const multiplier = (set.equipment?.includes("Dumbbell") || set.equipment === "Plates" || set.equipment === "Single Plate") ? 2 : 1;
    return sum + (set.weight * set.reps * multiplier);
  }, 0);

  const toggleSector = (sector: string) => {
    setExpandedSector(prev => prev === sector ? null : sector);
  };

  const openHistory = (ex: ExerciseDef) => {
    setSelectedEx(ex);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans relative pb-28 md:pb-12 overflow-x-hidden">
      <SharedUI activeProfile={activeProfile} />
      
      {/* Deep Dive Modal - Reused from Records */}
      <ExerciseHistoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        exercise={selectedEx} 
        logs={logs} 
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-2 md:mt-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          
          {/* --- TOP PROFILE HEADER --- */}
          <div className="bg-[#09090b] border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-4xl md:text-5xl uppercase shadow-[0_0_40px_rgba(16,185,129,0.3)] border-4 border-[#09090b]">
                {activeProfile.charAt(0)}
              </div>
              
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">Verified Operative</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">{activeProfile}</h2>
                
                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center md:items-start">
                    <Activity className="w-5 h-5 text-indigo-400 mb-2" />
                    <span className="text-2xl font-black text-white leading-none mb-1">{totalSets}</span>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">Total Sets</span>
                  </div>
                  <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center md:items-start">
                    <BarChart2 className="w-5 h-5 text-emerald-400 mb-2" />
                    <span className="text-2xl font-black text-white leading-none mb-1">{(totalVolume / 1000).toFixed(1)}k</span>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">Volume (Tons)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- SECTOR ACCORDIONS --- */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4 mb-4">Target Sectors</h3>
            
            {allMuscleGroups.map((sector) => {
              const isExpanded = expandedSector === sector;
              const sectorExercises = library.filter(ex => ex.muscleGroup === sector);

              return (
                <div key={sector} className="bg-[#09090b] border border-white/10 rounded-[1.5rem] overflow-hidden transition-all duration-300 shadow-lg">
                  {/* Accordion Header */}
                  <button 
                    onClick={() => toggleSector(sector)} 
                    className="w-full flex items-center justify-between p-5 md:p-6 active:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${isExpanded ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-zinc-400'}`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-start">
                        <h4 className="text-base md:text-lg font-black text-white uppercase tracking-wider">{sector}</h4>
                        <span className="text-[10px] uppercase font-bold text-zinc-500">{sectorExercises.length} Machines Forged</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : ''}`} />
                  </button>

                  {/* Accordion Body */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="border-t border-white/5 bg-black/30"
                      >
                        <div className="p-4 md:p-6 space-y-2">
                          {sectorExercises.length === 0 ? (
                            <div className="py-6 text-center">
                              <Dumbbell className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">No hardware forged for this sector yet.</p>
                            </div>
                          ) : (
                            sectorExercises.map(ex => (
                              <div 
                                key={ex.id}
                                onClick={() => openHistory(ex)}
                                className="flex items-center justify-between bg-[#0a0a0a] border border-white/5 p-3 rounded-2xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all cursor-pointer group shadow-inner"
                              >
                                <div className="flex items-center gap-3 md:gap-4">
                                  <ProfileThumbnail videoUrl={ex.videoUrl} />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">{ex.name}</span>
                                    <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 mt-0.5">{ex.equipment}</span>
                                  </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors mr-2">
                                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}