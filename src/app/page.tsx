"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Activity, Trash2, CheckCircle2, XCircle, Minus, ChevronDown, Target, Zap, X, BarChart2, Flame, CalendarDays } from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import SharedUI from "@/components/SharedUI";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuthAndData, ExerciseDef, LoggedSet, weeklySplit, daysOfWeek, getTrainingZone, API_URL } from "@/lib/store";

// --- OPTIMIZED VIDEO COMPONENT ---
// Prevents mobile lag by only playing video on desktop hover or inside the modal
const VideoGridItem = ({ ex, onClick, triggerDelete }: { ex: ExerciseDef, onClick: () => void, triggerDelete: (id: string, name: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    // Only auto-play on desktop devices
    if (window.innerWidth > 768 && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth > 768 && videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div 
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative cursor-pointer rounded-2xl md:rounded-3xl overflow-hidden border transition-all duration-300 group aspect-[4/5] bg-zinc-950 touch-manipulation hover:border-zinc-500 border-zinc-800/80"
    >
      <button onClick={(e) => { e.stopPropagation(); triggerDelete(ex.id, ex.name); }} className="absolute top-2 right-2 md:top-3 md:right-3 bg-red-500/90 text-white p-2 rounded-full opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all z-20 active:scale-90 shadow-lg">
        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
      </button>
      
      <video 
        ref={videoRef}
        src={ex.videoUrl} 
        loop 
        muted 
        playsInline 
        preload="metadata"
        className="absolute inset-0 object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" 
        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full p-3 md:p-4 pointer-events-none">
        <span className="text-[8px] md:text-[9px] text-zinc-400 uppercase tracking-widest font-bold block mb-1">{ex.equipment || ex.muscleGroup}</span>
        <h3 className="text-xs md:text-sm font-bold text-white leading-tight pr-2">{ex.name}</h3>
      </div>
    </div>
  );
};

export default function WorkoutPage() {
  const { activeProfile, library, logs, fetchLogs, fetchLibrary } = useAuthAndData();
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(false); 
  const [activeExercise, setActiveExercise] = useState<ExerciseDef | null>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [reps, setReps] = useState<number>(10);
  const [weight, setWeight] = useState<number>(0);
  const [currentGoal, setCurrentGoal] = useState({ weight: 0, reps: 0, achieved: false });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", confirmText: "Confirm", action: () => {} });

  useEffect(() => {
    const todayIndex = new Date().getDay();
    setSelectedDay(todayIndex === 0 ? "Sunday" : daysOfWeek[todayIndex - 1]);
  }, []);

  const targetMuscles = weeklySplit[selectedDay];
  const availableExercises = library.filter(ex => targetMuscles.includes(ex.muscleGroup));
  const todayString = new Date().toLocaleDateString('en-CA');
  const activeExerciseLogsToday = logs.filter(log => log.date === todayString && log.exerciseName === activeExercise?.name);
  const todayVolume = activeExerciseLogsToday.reduce((sum, set) => sum + (set.weight * set.reps * ((set.equipment.includes("Dumbbell") || set.equipment === "Plates") ? 2 : 1)), 0);

  // --- THE ELITE AI TRAINER PROTOCOL ---
  useEffect(() => {
    if (!activeExercise) return;

    // 1. Bodyweight Logic
    if (activeExercise.equipment === "Bodyweight") {
      setWeight(0);
      const bwHistory = logs.filter(log => log.exerciseName === activeExercise.name);
      const bestReps = bwHistory.length > 0 ? Math.max(...bwHistory.map(l => l.reps)) : 9;
      const targetR = bestReps + 1;
      setCurrentGoal({ weight: 0, reps: targetR, achieved: activeExerciseLogsToday.some(l => l.reps >= targetR) });
      if (activeExerciseLogsToday.length === 0) { setWeight(0); setReps(targetR); }
      return;
    }

    const exerciseHistory = logs.filter(log => log.exerciseName === activeExercise.name);
    
    if (exerciseHistory.length === 0) {
      setCurrentGoal({ weight: 0, reps: 0, achieved: false }); setWeight(0); setReps(10); return;
    }

    // 2. Recent Top-Set Isolation
    const sortedHistory = [...exerciseHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const mostRecentDate = sortedHistory[0].date;
    const recentSessionSets = sortedHistory.filter(log => log.date === mostRecentDate);
    const recentTopSet = recentSessionSets.reduce((best, current) => {
      if (current.weight > best.weight) return current;
      if (current.weight === best.weight && current.reps > best.reps) return current;
      return best;
    }, recentSessionSets[0]);

    let targetW = recentTopSet.weight;
    let targetR = recentTopSet.reps;

    // 3. Hardware-Aware Increments
    let weightIncrement = 2.5; 
    if (activeExercise.equipment.includes("Dumbbell")) weightIncrement = 4; 
    if (activeExercise.equipment === "Machine" || activeExercise.equipment === "Cable") weightIncrement = 5; 

    // 4. Elite Coaching Matrix
    if (targetR >= 12) { 
      targetW += weightIncrement; targetR = 8; 
    } else if (targetR < 6 && targetW > 0) { 
      targetW = Math.max(0, targetW - weightIncrement); targetR = 8; 
    } else { 
      targetR += 1; 
    }

    const hitToday = activeExerciseLogsToday.some(log => log.weight >= targetW && log.reps >= targetR);
    setCurrentGoal({ weight: targetW, reps: targetR, achieved: hitToday });
    
    if (activeExerciseLogsToday.length === 0) { setWeight(targetW); setReps(targetR); }
  }, [activeExercise, logs]);

  const handleLogSet = async (e: React.FormEvent) => {
    e.preventDefault(); if (!activeExercise) return;
    const currentSetNumber = activeExerciseLogsToday.length + 1;
    const newLog: LoggedSet = { id: Date.now().toString(), user: activeProfile, exerciseName: activeExercise.name, muscleGroup: activeExercise.muscleGroup, equipment: activeExercise.equipment || "Standard", setNumber: currentSetNumber, reps, weight, date: todayString };
    try {
      await axios.post(`${API_URL}/workoutLogs`, newLog); fetchLogs(activeProfile);
      if (currentGoal.weight > 0 && weight >= currentGoal.weight && reps >= currentGoal.reps && !currentGoal.achieved) {
        toast.success(`DIRECTIVE CRUSHED! Level Up!`, { icon: '🏆', style: { background: '#064e3b', color: '#fff', border: '1px solid #10b981' } });
      } else { toast.success(`Set ${currentSetNumber} Locked In`, { icon: '🔥' }); }
    } catch (error) { toast.error("Database connection failed."); }
  };

  const triggerDeleteLog = (logId: string) => {
    setConfirmDialog({
      isOpen: true, title: "Erase Set Data?", message: "Permanently delete this set from your history?", confirmText: "Erase",
      action: async () => { await axios.delete(`${API_URL}/workoutLogs/${logId}`); fetchLogs(activeProfile); setConfirmDialog(prev => ({ ...prev, isOpen: false })); toast.success("Record erased."); }
    });
  };

  const triggerDeleteExercise = (exId: string, exName: string) => {
    setConfirmDialog({
      isOpen: true, title: "Delete Machine?", message: `Permanently delete ${exName}? Past logs will remain safe.`, confirmText: "Delete",
      action: async () => { await axios.delete(`${API_URL}/exerciseLibrary/${exId}`); fetchLibrary(); setIsDashboardOpen(false); setConfirmDialog(prev => ({ ...prev, isOpen: false })); toast.success(`${exName} removed.`); }
    });
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white relative pb-28 md:pb-12 overflow-x-hidden">
      <SharedUI activeProfile={activeProfile} />
      <ConfirmDialog dialog={confirmDialog as any} setDialog={setConfirmDialog} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-2 md:mt-4 relative z-10">
        <div className="space-y-6 md:space-y-8">
          
          {/* MOBILE DAY SELECTOR */}
          <div className="md:hidden relative w-full pb-2 z-40">
            <button onClick={() => setIsDayMenuOpen(!isDayMenuOpen)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-[1.25rem] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.3)] active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedDay === "Anytime" ? "bg-orange-500/10 border border-orange-500/20 text-orange-400" : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"}`}>
                  {selectedDay === "Anytime" ? <Flame className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Active Protocol</span>
                  <span className="text-sm font-black text-white uppercase tracking-wider">{selectedDay}</span>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${isDayMenuOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            <AnimatePresence>
              {isDayMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsDayMenuOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 overflow-hidden">
                    <div className="grid grid-cols-2 gap-1.5">
                      {daysOfWeek.map(day => (
                        <button key={day} onClick={() => { setSelectedDay(day); setIsDayMenuOpen(false); }} className={`p-3 rounded-xl flex items-center justify-between font-bold text-xs uppercase tracking-wider transition-colors ${selectedDay === day ? (day === 'Anytime' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20') : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
                          <div className="flex items-center gap-2">{day === "Anytime" && <Flame className="w-3.5 h-3.5" />}{day}</div>
                          {selectedDay === day && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* DESKTOP DAY SELECTOR */}
          <div className="hidden md:flex justify-start space-x-2 w-full pb-4">
            {daysOfWeek.map(day => (
              <button key={day} onClick={() => setSelectedDay(day)} className={`flex flex-col items-center justify-center px-6 py-2.5 rounded-full transition-all duration-200 border active:scale-95 ${selectedDay === day ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-white"}`}>
                <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">{day === "Anytime" && <Flame className={`w-3.5 h-3.5 ${selectedDay === day ? 'text-black' : 'text-orange-500'}`} />}{day}</span>
              </button>
            ))}
          </div>

          {targetMuscles.includes("Rest") ? (
            <div className="flex flex-col items-center justify-center h-[50vh] border border-dashed border-zinc-800 rounded-[2rem] mx-1 md:mx-0">
              <Activity className="w-12 h-12 text-zinc-700 mb-4" /><h2 className="text-2xl md:text-3xl font-black text-zinc-600 uppercase tracking-widest text-center">Recovery Day</h2>
            </div>
          ) : (
            <>
              {/* THE OPTIMIZED EXERCISE GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 pb-10">
                {availableExercises.map(ex => (
                  <VideoGridItem 
                    key={ex.id} 
                    ex={ex} 
                    onClick={() => { setActiveExercise(ex); setIsDashboardOpen(true); }} 
                    triggerDelete={triggerDeleteExercise} 
                  />
                ))}
                <Link href="/forge" className="cursor-pointer rounded-2xl md:rounded-3xl border-2 border-dashed border-zinc-800 hover:border-zinc-500 bg-zinc-900/20 flex flex-col items-center justify-center aspect-[4/5] transition-all group touch-manipulation">
                  <Plus className="text-zinc-600 group-hover:text-white w-6 h-6 md:w-8 md:h-8 mb-2 transition-colors" />
                  <span className="text-[9px] md:text-[10px] font-bold text-zinc-600 group-hover:text-white uppercase tracking-widest transition-colors">Add Machine</span>
                </Link>
              </div>

              {/* EXECUTION MODAL */}
              <AnimatePresence>
                {isDashboardOpen && activeExercise && (
                  <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/90" onClick={() => setIsDashboardOpen(false)} />
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.35 }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.2} onDragEnd={(e, { offset, velocity }) => { if (offset.y > 100 || velocity.y > 500) setIsDashboardOpen(false); }} className="bg-[#09090b] border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl relative z-10 w-full max-w-4xl max-h-[92vh] md:max-h-[85vh] flex flex-col overflow-hidden transform-gpu will-change-transform">
                      <div className="w-12 h-1.5 bg-zinc-700/50 rounded-full mx-auto mt-4 mb-2 md:hidden flex-shrink-0" />
                      <div className="px-5 md:px-8 pt-2 md:pt-8 pb-5 flex justify-between items-start flex-shrink-0 border-b border-white/5">
                        <div className="pr-4">
                          <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-2">{activeExercise.name}</h2>
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] md:text-xs text-indigo-400 font-bold uppercase tracking-widest">{activeExercise.machineName}</p>
                            <span className="text-zinc-600 text-[10px]">•</span>
                            <p className="text-[10px] md:text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Vol: {todayVolume}kg</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10 text-white font-black flex-shrink-0 text-sm md:text-base">{activeExerciseLogsToday.length + 1}</div>
                          <button onClick={() => setIsDashboardOpen(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800/50 hover:bg-zinc-700 hidden md:flex items-center justify-center text-zinc-400 hover:text-white transition-colors active:scale-95"><X className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <div className="overflow-y-auto custom-scrollbar flex-1 p-5 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-10 relative">
                          {activeExercise.videoUrl && (
                            <div className="w-full md:w-[320px] flex-shrink-0 relative">
                              <div className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)] bg-zinc-950 relative md:sticky md:top-0 max-h-[350px] md:max-h-[450px]">
                                {/* Inside the modal, we DO autoPlay because it's only one video at a time */}
                                <video src={activeExercise.videoUrl} autoPlay loop muted playsInline className="absolute inset-0 object-cover w-full h-full opacity-85" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-full p-5 pointer-events-none flex justify-between items-end">
                                  <span className="inline-block px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-[9px] text-white uppercase tracking-widest font-bold">{activeExercise.equipment || "Equipment"}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex-1 flex flex-col min-w-0 pb-10">
                            {currentGoal.weight > 0 && (
                              <div className={`mb-6 p-4 md:p-6 rounded-2xl border flex items-center justify-between transition-colors duration-500 ${currentGoal.achieved ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-indigo-500/10 border-indigo-500/30'}`}>
                                <div className="flex items-center gap-3 md:gap-4">
                                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${currentGoal.achieved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                    {currentGoal.achieved ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <Target className="w-5 h-5 md:w-6 md:h-6" />}
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-0.5">Next Directive</p>
                                    <p className={`text-base md:text-lg font-black ${currentGoal.achieved ? 'text-emerald-400' : 'text-indigo-400'}`}>{currentGoal.weight}kg for {currentGoal.reps}+ Reps</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md mb-1 ${currentGoal.achieved ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'}`}>{getTrainingZone(currentGoal.reps).label}</span>
                                </div>
                              </div>
                            )}

                            <form onSubmit={handleLogSet} className="space-y-4 md:space-y-6 mb-8">
                              <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1 flex items-center justify-between bg-black/40 p-2 md:p-3 rounded-2xl border border-white/5 focus-within:border-white/30 transition-all touch-manipulation shadow-inner min-w-0">
                                  <button type="button" onClick={() => setReps(Math.max(0, reps - 1))} className="w-12 h-12 flex items-center justify-center bg-zinc-900/80 rounded-[14px] hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors active:scale-90 flex-shrink-0"><Minus className="w-5 h-5"/></button>
                                  <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-2">
                                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Reps</label>
                                    <input type="number" value={reps} onChange={e => setReps(Number(e.target.value))} className="w-24 bg-transparent text-center text-4xl font-black text-white outline-none" required />
                                    <span className={`text-[8px] md:text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-1 mt-2 px-2 py-1 rounded-md ${getTrainingZone(reps).bg} ${getTrainingZone(reps).color} ${getTrainingZone(reps).border} border`}><Zap className="w-2.5 h-2.5 flex-shrink-0" /> <span className="truncate">{getTrainingZone(reps).label}</span></span>
                                  </div>
                                  <button type="button" onClick={() => setReps(reps + 1)} className="w-12 h-12 flex items-center justify-center bg-zinc-900/80 rounded-[14px] hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors active:scale-90 flex-shrink-0"><Plus className="w-5 h-5"/></button>
                                </div>

                                <div className={`flex-1 flex items-center justify-between bg-black/40 p-2 md:p-3 rounded-2xl border border-white/5 focus-within:border-indigo-500 transition-all touch-manipulation shadow-inner min-w-0 ${activeExercise.equipment === 'Bodyweight' ? 'opacity-50 pointer-events-none' : ''}`}>
                                  <button type="button" onClick={() => setWeight(Math.max(0, weight - 2.5))} className="w-12 h-12 flex items-center justify-center bg-zinc-900/80 rounded-[14px] hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 transition-colors active:scale-90 flex-shrink-0"><Minus className="w-5 h-5"/></button>
                                  <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-2">
                                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold truncate w-full text-center">{(activeExercise.equipment.includes("Dumbbell") || activeExercise.equipment === "Plates") ? "Load (Arm)" : "Load (Total)"}</label>
                                    <div className="flex items-center justify-center w-full relative">
                                      <input type="number" step="0.5" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-28 bg-transparent text-center text-4xl font-black text-indigo-400 outline-none" required />
                                      {(activeExercise.equipment.includes("Dumbbell") || activeExercise.equipment === "Plates") && (
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 bg-zinc-800 text-zinc-400 text-[10px] font-black px-1.5 py-0.5 rounded-md pointer-events-none hidden md:block">x2</span>
                                      )}
                                    </div>
                                    <span className="text-[8px] md:text-[9px] opacity-0 flex items-center mt-2 px-2 py-1">Spacer</span>
                                  </div>
                                  <button type="button" onClick={() => setWeight(weight + 2.5)} className="w-12 h-12 flex items-center justify-center bg-zinc-900/80 rounded-[14px] hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 transition-colors active:scale-90 flex-shrink-0"><Plus className="w-5 h-5"/></button>
                                </div>
                              </div>
                              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 md:py-5 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] touch-manipulation"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> Log Set {activeExerciseLogsToday.length + 1}</button>
                            </form>

                            {activeExerciseLogsToday.length > 0 && (
                              <div className="pt-6 border-t border-white/5">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Today's Protocol</h3>
                                <div className="space-y-3">
                                    {activeExerciseLogsToday.map((set) => (
                                      <div key={set.id} className="flex justify-between items-center bg-black/40 border border-white/5 p-4 md:p-5 rounded-[1.25rem] group hover:border-white/10 transition-colors">
                                        <div className="flex gap-5 md:gap-8 items-center">
                                          <span className="text-zinc-500 font-bold w-4 text-sm md:text-base">{set.setNumber}</span>
                                          <span className="text-white font-bold text-lg md:text-xl">{set.reps} <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-normal">Reps</span></span>
                                        </div>
                                        <div className="flex items-center gap-4 md:gap-6">
                                          <span className="text-indigo-400 font-black text-lg md:text-xl flex items-center gap-1.5">
                                            {set.weight} <span className="text-[10px] uppercase font-bold text-zinc-500">kg</span>
                                            {(set.equipment.includes("Dumbbell") || set.equipment === "Plates") ? <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded ml-1">x2</span> : null}
                                          </span>
                                          <button onClick={() => triggerDeleteLog(set.id)} className="text-zinc-500 hover:text-red-500 transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100 p-2 active:scale-90"><XCircle className="w-5 h-5 md:w-6 h-6" /></button>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
    </div>
  );
}