"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Activity, CalendarDays, Trash2, Dumbbell, Play, CheckCircle2, XCircle, ChevronRight, Minus, Link2, FileText, Settings2, Eye, AlertTriangle, ChevronDown, Type, Target, Zap, X, BarChart2, UploadCloud, LogOut, Flame } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

// --- Interfaces ---
interface ExerciseDef { id: string; name: string; machineName: string; muscleGroup: string; equipment: string; videoUrl: string; instructions: string; }
interface LoggedSet { id: string; user: string; exerciseName: string; setNumber: number; reps: number; weight: number; muscleGroup: string; equipment: string; date: string; }

const allMuscleGroups = ["Chest", "Back", "Legs", "Shoulders", "Biceps", "Triceps", "Core", "Forearm", "Calves"];
const allEquipmentTypes = ["Barbell", "Single Dumbbell", "Dumbbells", "Machine", "Cable", "Bodyweight", "Smith Machine", "Kettlebell", "Single Plate", "Plates"];

const weeklySplit: Record<string, string[]> = {
  "Monday": ["Chest", "Triceps"], 
  "Tuesday": ["Back", "Biceps", "Forearm"], 
  "Wednesday": ["Legs", "Shoulders", "Calves"],
  "Thursday": ["Chest", "Triceps"], 
  "Friday": ["Back", "Biceps", "Forearm"], 
  "Saturday": ["Legs", "Shoulders", "Calves"], 
  "Sunday": ["Rest"],
  "Anytime": allMuscleGroups 
};
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Anytime"];

const formatRecordDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    dateDisplay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
};

const getTrainingZone = (reps: number) => {
  if (reps <= 5) return { label: "Raw Strength", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
  if (reps <= 12) return { label: "Hypertrophy", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  return { label: "Endurance", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
};

const PremiumSelect = ({ value, onChange, options, icon: Icon, placeholder, label }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="space-y-1.5 relative z-20">
      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">{label}</label>
      <div className="relative group">
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-sm md:text-base text-white focus:border-emerald-500/50 outline-none transition-all shadow-inner">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className={`w-4 h-4 transition-colors ${isOpen ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
          </div>
          <span className="font-medium">{value || placeholder}</span>
          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className="absolute z-40 w-full mt-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {options.map((opt: string) => (
                    <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`px-4 py-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${value === opt ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'hover:bg-white/5 text-zinc-300 hover:text-white'}`}>
                      {opt}
                      {value === opt && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function TitanForgeElite() {
  const [library, setLibrary] = useState<ExerciseDef[]>([]);
  const [logs, setLogs] = useState<LoggedSet[]>([]);
  const [appMode, setAppMode] = useState<"workout" | "records" | "add">("workout");
  
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(false); 
  
  const [activeExercise, setActiveExercise] = useState<ExerciseDef | null>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const [activeProfile, setActiveProfile] = useState<string>("");

  const [reps, setReps] = useState<number>(10);
  const [weight, setWeight] = useState<number>(0);
  const [currentGoal, setCurrentGoal] = useState({ weight: 0, reps: 0, achieved: false });

  const [newExName, setNewExName] = useState("");
  const [newExMachine, setNewExMachine] = useState("");
  const [newExMuscle, setNewExMuscle] = useState("Chest");
  const [newExEquipment, setNewExEquipment] = useState("Barbell");
  const [newExVideo, setNewExVideo] = useState("");
  const [newExInstructions, setNewExInstructions] = useState("");

  const [videoMode, setVideoMode] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; confirmText: string; action: () => void; }>({ isOpen: false, title: "", message: "", confirmText: "Confirm", action: () => {} });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchLogs = (user: string) => axios.get(`${API_URL}/workoutLogs?user=${user}`).then(res => setLogs(res.data)).catch(console.error);
  const fetchLibrary = () => axios.get(`${API_URL}/exerciseLibrary`).then(res => setLibrary(res.data)).catch(console.error);

  useEffect(() => {
    axios.get('/api/auth/me')
      .then(res => {
        if (res.data.username) {
          setActiveProfile(res.data.username);
          fetchLogs(res.data.username);
        }
      })
      .catch(() => {
        window.location.href = '/login';
      });

    const todayIndex = new Date().getDay();
    const actualDay = todayIndex === 0 ? "Sunday" : daysOfWeek[todayIndex - 1];
    setSelectedDay(actualDay);
    fetchLibrary();
  }, []);

  const handleLogout = async () => {
    await axios.post('/api/auth/logout');
    window.location.href = '/login';
  };

  useEffect(() => {
    if (isDashboardOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [isDashboardOpen]);

  const targetMuscles = weeklySplit[selectedDay];
  const availableExercises = library.filter(ex => targetMuscles.includes(ex.muscleGroup));

  const todayString = new Date().toLocaleDateString('en-CA');
  const activeExerciseLogsToday = logs.filter(log => log.date === todayString && log.exerciseName === activeExercise?.name);
  
  const todayVolume = activeExerciseLogsToday.reduce((sum, set) => {
    const multiplier = (set.equipment === "Dumbbells" || set.equipment === "Plates") ? 2 : 1;
    return sum + (set.weight * set.reps * multiplier);
  }, 0);

useEffect(() => {
    if (!activeExercise) return;

    // --- 1. BODYWEIGHT PROTOCOL ---
    if (activeExercise.equipment === "Bodyweight") {
      setWeight(0);
      const bwHistory = logs.filter(log => log.exerciseName === activeExercise.name);
      
      const bestReps = bwHistory.length > 0 ? Math.max(...bwHistory.map(l => l.reps)) : 9;
      const targetR = bestReps + 1;
      
      setCurrentGoal({ weight: 0, reps: targetR, achieved: activeExerciseLogsToday.some(l => l.reps >= targetR) });
      if (activeExerciseLogsToday.length === 0) {
        setWeight(0);
        setReps(targetR);
      }
      return;
    }

    const exerciseHistory = logs.filter(log => log.exerciseName === activeExercise.name);
    
    if (exerciseHistory.length === 0) {
      setCurrentGoal({ weight: 0, reps: 0, achieved: false });
      setWeight(0); setReps(10);
      return;
    }

    // --- 2. RECENT TOP-SET ISOLATION ---
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

    // --- 3. HARDWARE-AWARE INCREMENTS ---
    // The AI adjusts the math based on the specific machine you are using
    let weightIncrement = 2.5; // Standard Barbell micro-load
    if (activeExercise.equipment === "Dumbbells") weightIncrement = 4; // Min 2kg per hand
    if (activeExercise.equipment === "Machine" || activeExercise.equipment === "Cable") weightIncrement = 5; // Standard pin jumps

    // --- 4. THE ELITE COACHING MATRIX ---
    if (targetR >= 12) {
      // ZONE CLEARED: You mastered this weight. Force progressive overload.
      targetW += weightIncrement;
      targetR = 8; // Reset to the bottom of the hypertrophy window
    } else if (targetR < 6 && targetW > 0) {
      // EGO LIFT DETECTED: Weight was too heavy for optimal muscle tear.
      // The AI forces a deload to fix your form.
      targetW = Math.max(0, targetW - weightIncrement);
      targetR = 8;
    } else {
      // IN THE TRENCHES: Perfect weight zone. The AI demands 1 more rep of suffering.
      targetR += 1;
    }

    const hitToday = activeExerciseLogsToday.some(log => log.weight >= targetW && log.reps >= targetR);
    setCurrentGoal({ weight: targetW, reps: targetR, achieved: hitToday });

    // Auto-load the exact target for the operative's first set
    if (activeExerciseLogsToday.length === 0) {
      setWeight(targetW);
      setReps(targetR);
    }
  }, [activeExercise, logs]); 

  const handleLogSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExercise) return;
    
    const currentSetNumber = activeExerciseLogsToday.length + 1;
    const newLog: LoggedSet = { id: Date.now().toString(), user: activeProfile, exerciseName: activeExercise.name, muscleGroup: activeExercise.muscleGroup, equipment: activeExercise.equipment || "Standard", setNumber: currentSetNumber, reps, weight, date: todayString };
    
    try {
      await axios.post(`${API_URL}/workoutLogs`, newLog);
      fetchLogs(activeProfile);
      
      if (currentGoal.weight > 0 && weight >= currentGoal.weight && reps >= currentGoal.reps && !currentGoal.achieved) {
        toast.success(`DIRECTIVE CRUSHED! Level Up!`, { icon: '🏆', style: { background: '#064e3b', color: '#fff', border: '1px solid #10b981' } });
      } else {
        toast.success(`Set ${currentSetNumber} Locked In`, { icon: '🔥' });
      }
    } catch (error) { toast.error("Database connection failed."); }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

    if (!cloudName || !preset) {
      toast.error("Cloudinary config missing in .env");
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
            setUploadProgress(percentCompleted);
          }
        }
      );
      setNewExVideo(res.data.secure_url);
      toast.success("Video synced to cloud.");
    } catch (error) {
      toast.error("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddNewExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExVideo) { toast.error("Visual Feed required."); return; }

    const newExercise: ExerciseDef = { id: "ex_" + Date.now().toString(), name: newExName, machineName: newExMachine, muscleGroup: newExMuscle, equipment: newExEquipment, videoUrl: newExVideo, instructions: newExInstructions };
    try {
      await axios.post(`${API_URL}/exerciseLibrary`, newExercise);
      fetchLibrary(); 
      toast.success(`${newExName} Forged`, { icon: '⚒️' });
      setNewExName(""); setNewExMachine(""); setNewExEquipment("Barbell"); setNewExVideo(""); setNewExInstructions(""); setAppMode("workout"); 
    } catch (error) { toast.error("Failed to forge exercise."); }
  };

  const triggerDeleteLog = (logId: string) => {
    setConfirmDialog({
      isOpen: true, title: "Erase Set Data?", message: "Are you sure you want to permanently delete this set from your history?", confirmText: "Erase",
      action: async () => {
        try { await axios.delete(`${API_URL}/workoutLogs/${logId}`); fetchLogs(activeProfile); setConfirmDialog(prev => ({ ...prev, isOpen: false })); toast.success("Record erased."); } 
        catch (error) { toast.error("Failed to delete."); }
      }
    });
  };

  const triggerDeleteExercise = (exId: string, exName: string) => {
    setConfirmDialog({
      isOpen: true, title: "Delete Machine?", message: `Are you sure you want to delete ${exName}? Past logs will remain safe.`, confirmText: "Delete",
      action: async () => {
        try { await axios.delete(`${API_URL}/exerciseLibrary/${exId}`); fetchLibrary(); setIsDashboardOpen(false); setConfirmDialog(prev => ({ ...prev, isOpen: false })); toast.success(`${exName} removed.`); } 
        catch (error) { toast.error("Failed to delete."); }
      }
    });
  };

  const groupedByDate = logs.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log); return acc;
  }, {} as Record<string, LoggedSet[]>);
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const groupByExercise = (dayLogs: LoggedSet[]) => {
    return dayLogs.reduce((acc, log) => {
      if (!acc[log.exerciseName]) acc[log.exerciseName] = [];
      acc[log.exerciseName].push(log); return acc;
    }, {} as Record<string, LoggedSet[]>);
  };

  const navItems = [
    { id: "workout", label: "Workout", icon: <Play className="w-5 h-5 md:w-4 md:h-4" /> },
    { id: "records", label: "Records", icon: <CalendarDays className="w-5 h-5 md:w-4 md:h-4" /> },
    { id: "add", label: "Forge", icon: <Plus className="w-5 h-5 md:w-4 md:h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white relative pb-28 md:pb-12 overflow-x-hidden">
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 9999px; }
        input[type='number']::-webkit-inner-spin-button, input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type='number'] { -moz-appearance: textfield; padding: 0; }
        html, body { overscroll-behavior-x: none; }
      `}} />

      {/* --- REDUCED BLUR INTENSITY FOR PERFORMANCE --- */}
      <div className="fixed top-0 left-1/4 w-[70vw] md:w-[50vw] h-[70vw] md:h-[50vw] rounded-full bg-indigo-900/15 blur-[60px] md:blur-[120px] pointer-events-none mix-blend-screen"></div>
      
      <Toaster position="top-center" toastOptions={{ style: { background: 'rgba(24, 24, 27, 0.95)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9999px', padding: '12px 24px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' } }} />

      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/90" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "tween", duration: 0.2 }} className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl relative z-10 w-full max-w-sm flex flex-col items-center text-center mx-4">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20"><AlertTriangle className="w-8 h-8" /></div>
              <h3 className="text-2xl font-black text-white mb-2">{confirmDialog.title}</h3>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed px-2">{confirmDialog.message}</p>
              <div className="flex w-full gap-3">
                <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3.5 md:py-4 rounded-2xl font-bold transition-colors text-sm active:scale-95">Cancel</button>
                <button onClick={confirmDialog.action} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3.5 md:py-4 rounded-2xl font-bold transition-colors text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95">{confirmDialog.confirmText}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="pt-6 pb-4 px-5 md:pt-8 md:pb-4 md:px-6 max-w-7xl mx-auto flex items-center justify-between relative pointer-events-none">
        <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]"><Activity className="w-6 h-6 md:w-7 md:h-7 stroke-[2.5]" /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase leading-none">Light</h1>
            <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold tracking-[0.3em] md:tracking-[0.4em] uppercase leading-none mt-1.5">Forge System</p>
          </div>
        </div>

        {activeProfile && (
          <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
            <div className="flex items-center gap-2 bg-[#09090b] border border-white/10 rounded-full p-1 sm:pr-4 shadow-lg">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xs md:text-sm uppercase shadow-inner">
                {activeProfile.charAt(0)}
              </div>
              <span className="text-xs font-bold text-zinc-300 hidden sm:block">{activeProfile}</span>
            </div>
            <button onClick={handleLogout} className="bg-[#09090b] hover:bg-red-500/20 text-zinc-500 hover:text-red-500 p-2.5 md:p-3 rounded-full transition-colors border border-white/10 hover:border-red-500/30 shadow-lg flex items-center justify-center cursor-pointer">
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        )}
      </header>

      <div className={`fixed bottom-6 left-0 right-0 z-50 pointer-events-none flex justify-center px-6 md:bottom-auto md:top-6 md:px-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isDashboardOpen ? 'translate-y-32 md:translate-y-0 opacity-0 md:opacity-100' : 'translate-y-0 opacity-100'}`}>
        <nav className="bg-[#09090b] border border-white/10 p-1.5 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.5)] pointer-events-auto flex gap-1 w-full md:w-auto justify-between md:justify-start">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setAppMode(item.id)} className={`relative flex items-center justify-center gap-2 px-6 py-4 md:px-5 md:py-2.5 rounded-full font-bold text-sm transition-colors z-10 flex-1 md:flex-none ${appMode === item.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
              {appMode === item.id && <motion.div layoutId="dockBubble" className="absolute inset-0 bg-white/10 border border-white/10 rounded-full -z-10" transition={{ duration: 0.2 }} />}
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-2 md:mt-4 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={appMode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

            {/* ================= WORKOUT MODE ================= */}
            {appMode === "workout" && (
              <div className="space-y-6 md:space-y-8">
                
                <div className="md:hidden relative w-full pb-2 z-40">
                  <button 
                    onClick={() => setIsDayMenuOpen(!isDayMenuOpen)} 
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-[1.25rem] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.3)] active:scale-[0.98] transition-all"
                  >
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
                        <motion.div 
                          initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                          animate={{ opacity: 1, y: 0, scale: 1 }} 
                          exit={{ opacity: 0, y: -10, scale: 0.95 }} 
                          transition={{ duration: 0.2 }} 
                          className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-1.5">
                            {daysOfWeek.map(day => (
                              <button 
                                key={day}
                                onClick={() => { setSelectedDay(day); setIsDayMenuOpen(false); }} 
                                className={`p-3 rounded-xl flex items-center justify-between font-bold text-xs uppercase tracking-wider transition-colors ${selectedDay === day ? (day === 'Anytime' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20') : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
                              >
                                <div className="flex items-center gap-2">
                                  {day === "Anytime" && <Flame className="w-3.5 h-3.5" />}
                                  {day}
                                </div>
                                {selectedDay === day && <CheckCircle2 className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="hidden md:flex justify-start space-x-2 w-full pb-4">
                  {daysOfWeek.map(day => (
                    <button key={day} onClick={() => setSelectedDay(day)} className={`flex flex-col items-center justify-center px-6 py-2.5 rounded-full transition-all duration-200 border active:scale-95 ${selectedDay === day ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-white"}`}>
                      <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                        {day === "Anytime" && <Flame className={`w-3.5 h-3.5 ${selectedDay === day ? 'text-black' : 'text-orange-500'}`} />}
                        {day}
                      </span>
                    </button>
                  ))}
                </div>

                {targetMuscles.includes("Rest") ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] border border-dashed border-zinc-800 rounded-[2rem] mx-1 md:mx-0">
                    <Activity className="w-12 h-12 text-zinc-700 mb-4" />
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-600 uppercase tracking-widest text-center">Recovery Day</h2>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 pb-10">
                      {availableExercises.map(ex => (
                        <div 
                          key={ex.id} 
                          onClick={() => { setActiveExercise(ex); setIsDashboardOpen(true); }} 
                          className={`relative cursor-pointer rounded-2xl md:rounded-3xl overflow-hidden border transition-all duration-300 group aspect-[4/5] bg-zinc-950 touch-manipulation hover:border-zinc-500 border-zinc-800/80`}
                        >
                          <button onClick={(e) => { e.stopPropagation(); triggerDeleteExercise(ex.id, ex.name); }} className="absolute top-2 right-2 md:top-3 md:right-3 bg-red-500/90 text-white p-2 rounded-full opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all z-20 active:scale-90 shadow-lg"><Trash2 className="w-3 h-3 md:w-4 md:h-4" /></button>
                          <video src={ex.videoUrl} autoPlay loop muted playsInline className="absolute inset-0 object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
                          <div className="absolute bottom-0 left-0 w-full p-3 md:p-4 pointer-events-none">
                            <span className="text-[8px] md:text-[9px] text-zinc-400 uppercase tracking-widest font-bold block mb-1">{ex.equipment || ex.muscleGroup}</span>
                            <h3 className="text-xs md:text-sm font-bold text-white leading-tight pr-2">{ex.name}</h3>
                          </div>
                        </div>
                      ))}
                      <div onClick={() => setAppMode("add")} className="cursor-pointer rounded-2xl md:rounded-3xl border-2 border-dashed border-zinc-800 hover:border-zinc-500 bg-zinc-900/20 flex flex-col items-center justify-center aspect-[4/5] transition-all group touch-manipulation">
                        <Plus className="text-zinc-600 group-hover:text-white w-6 h-6 md:w-8 md:h-8 mb-2 transition-colors" />
                        <span className="text-[9px] md:text-[10px] font-bold text-zinc-600 group-hover:text-white uppercase tracking-widest transition-colors">Add Machine</span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isDashboardOpen && activeExercise && (
                        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-6">
                          
                          {/* --- OPTIMIZATION 1: REMOVED BACKDROP BLUR FOR SOLID 90% BLACK --- */}
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/90" onClick={() => setIsDashboardOpen(false)} />
                          
                          {/* --- OPTIMIZATION 2: TRANSFORM-GPU, SOLID BACKGROUND, NO OPACITY FADE --- */}
                          <motion.div 
                            initial={{ y: "100%" }} 
                            animate={{ y: 0 }} 
                            exit={{ y: "100%" }} 
                            transition={{ type: "spring", bounce: 0, duration: 0.35 }} 
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                              if (offset.y > 100 || velocity.y > 500) setIsDashboardOpen(false);
                            }}
                            className="bg-[#09090b] border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl relative z-10 w-full max-w-4xl max-h-[92vh] md:max-h-[85vh] flex flex-col overflow-hidden transform-gpu will-change-transform"
                          >
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
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10 text-white font-black flex-shrink-0 text-sm md:text-base">
                                  {activeExerciseLogsToday.length + 1}
                                </div>
                                <button onClick={() => setIsDashboardOpen(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800/50 hover:bg-zinc-700 hidden md:flex items-center justify-center text-zinc-400 hover:text-white transition-colors active:scale-95"><X className="w-5 h-5" /></button>
                              </div>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar flex-1 p-5 md:p-8">
                              <div className="flex flex-col md:flex-row gap-6 md:gap-10 relative">
                                
                                {activeExercise.videoUrl && (
                                  <div className="w-full md:w-[320px] flex-shrink-0 relative">
                                    <div className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)] bg-zinc-950 relative md:sticky md:top-0 max-h-[350px] md:max-h-[450px]">
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
                                          <p className={`text-base md:text-lg font-black ${currentGoal.achieved ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                            {currentGoal.weight}kg for {currentGoal.reps}+ Reps
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md mb-1 ${currentGoal.achieved ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'}`}>
                                          {getTrainingZone(currentGoal.reps).label}
                                        </span>
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
                                          <span className={`text-[8px] md:text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-1 mt-2 px-2 py-1 rounded-md ${getTrainingZone(reps).bg} ${getTrainingZone(reps).color} ${getTrainingZone(reps).border} border`}>
                                            <Zap className="w-2.5 h-2.5 flex-shrink-0" /> <span className="truncate">{getTrainingZone(reps).label}</span>
                                          </span>
                                        </div>
                                        <button type="button" onClick={() => setReps(reps + 1)} className="w-12 h-12 flex items-center justify-center bg-zinc-900/80 rounded-[14px] hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors active:scale-90 flex-shrink-0"><Plus className="w-5 h-5"/></button>
                                      </div>

                                      <div className={`flex-1 flex items-center justify-between bg-black/40 p-2 md:p-3 rounded-2xl border border-white/5 focus-within:border-indigo-500 transition-all touch-manipulation shadow-inner min-w-0 ${activeExercise.equipment === 'Bodyweight' ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <button type="button" onClick={() => setWeight(Math.max(0, weight - 2.5))} className="w-12 h-12 flex items-center justify-center bg-zinc-900/80 rounded-[14px] hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 transition-colors active:scale-90 flex-shrink-0"><Minus className="w-5 h-5"/></button>
                                        <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-2">
                                          <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold truncate w-full text-center">
                                            {activeExercise.equipment === "Dumbbells" || activeExercise.equipment === "Single Dumbbell" || activeExercise.equipment === "Single Plate" ? "Load (Arm)" : "Load (Total)"}
                                          </label>
                                          <div className="flex items-center justify-center w-full relative">
                                            <input type="number" step="0.5" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-28 bg-transparent text-center text-4xl font-black text-indigo-400 outline-none" required />
                                            {(activeExercise.equipment === "Dumbbells" || activeExercise.equipment === "Plates") && (
                                              <span className="absolute right-0 top-1/2 -translate-y-1/2 bg-zinc-800 text-zinc-400 text-[10px] font-black px-1.5 py-0.5 rounded-md pointer-events-none hidden md:block">x2</span>
                                            )}
                                          </div>
                                          <span className="text-[8px] md:text-[9px] opacity-0 flex items-center mt-2 px-2 py-1">Spacer</span>
                                        </div>
                                        <button type="button" onClick={() => setWeight(weight + 2.5)} className="w-12 h-12 flex items-center justify-center bg-zinc-900/80 rounded-[14px] hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 transition-colors active:scale-90 flex-shrink-0"><Plus className="w-5 h-5"/></button>
                                      </div>

                                    </div>
                                    <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 md:py-5 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] touch-manipulation">
                                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> Log Set {activeExerciseLogsToday.length + 1}
                                    </button>
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
                                                  {set.weight} 
                                                  <span className="text-[10px] uppercase font-bold text-zinc-500">kg</span>
                                                  {(set.equipment === "Dumbbells" || set.equipment === "Plates") ? <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded ml-1">x2</span> : null}
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
            )}

{/* ================= FORGE (ADD) MODE ================= */}
            {appMode === "add" && (
              <div className="max-w-6xl mx-auto px-1 md:px-2 mt-2 md:mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                  <div className="lg:col-span-7 space-y-6 md:space-y-8">
                    <div className="text-center md:text-left">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                        <Settings2 className="w-6 h-6 md:w-7 md:h-7 stroke-[2]" />
                      </div>
                      <h2 className="text-2xl md:text-4xl font-black text-white mb-2 leading-tight tracking-tight">Forge Hardware</h2>
                      <p className="text-xs md:text-sm text-zinc-400 px-4 md:px-0">Configure parameters to expand your training matrix.</p>
                    </div>
                    
                    <form onSubmit={handleAddNewExercise} className="space-y-4 md:space-y-5 bg-zinc-900/20 backdrop-blur-md border border-white/5 p-5 md:p-8 rounded-[2rem] shadow-2xl">
                      
                      {/* --- FIX: ADDED relative z-30 TO FORCE THIS ROW ABOVE THE NEXT --- */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 relative z-30">
                        <div className="space-y-1.5 relative">
                          <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">Designation</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Type className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" /></div>
                            <input type="text" value={newExName} onChange={e => setNewExName(e.target.value)} placeholder="e.g. Lateral Raise" className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-sm md:text-base text-white placeholder-zinc-700 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all shadow-inner" required />
                          </div>
                        </div>

                        <PremiumSelect label="Target Sector" value={newExMuscle} onChange={setNewExMuscle} options={allMuscleGroups} icon={Activity} placeholder="Select Muscle" />
                      </div>

                      {/* --- FIX: ADDED relative z-20 SO IT SITS BELOW ROW 1 --- */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 relative z-20">
                        <div className="space-y-1.5 relative">
                          <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">Machine Class</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Activity className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" /></div>
                            <input type="text" value={newExMachine} onChange={e => setNewExMachine(e.target.value)} placeholder="e.g. Incline Bench" className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-sm md:text-base text-white placeholder-zinc-700 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all shadow-inner" required />
                          </div>
                        </div>

                        <PremiumSelect label="Equipment Type" value={newExEquipment} onChange={setNewExEquipment} options={allEquipmentTypes} icon={Dumbbell} placeholder="Select Equipment" />
                      </div>

                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">Visual Feed</label>
                          <div className="flex bg-black/50 rounded-lg p-0.5 border border-white/5">
                            <button type="button" onClick={() => setVideoMode('url')} className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-md transition-all ${videoMode === 'url' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Link</button>
                            <button type="button" onClick={() => setVideoMode('upload')} className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-md transition-all ${videoMode === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Upload</button>
                          </div>
                        </div>

                        <AnimatePresence mode="wait">
                          {videoMode === 'url' ? (
                            <motion.div key="url" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Link2 className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" /></div>
                              <input type="text" value={newExVideo} onChange={e => setNewExVideo(e.target.value)} placeholder="https://..." className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-sm md:text-base text-white placeholder-zinc-700 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all shadow-inner" />
                            </motion.div>
                          ) : (
                            <motion.div key="upload" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="relative group">
                              <div className="relative flex items-center justify-center w-full bg-zinc-900/50 backdrop-blur-md border border-dashed border-white/20 rounded-xl md:rounded-2xl py-6 hover:border-emerald-500/50 transition-all overflow-hidden">
                                <input type="file" accept="video/*" onChange={handleVideoUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                                <div className="flex flex-col items-center pointer-events-none">
                                  {isUploading ? (
                                    <>
                                      <Activity className="w-6 h-6 text-emerald-400 mb-2 animate-spin" />
                                      <span className="text-xs text-emerald-400 font-bold">{uploadProgress}% Uploading...</span>
                                      <div className="w-32 h-1 bg-zinc-800 rounded-full mt-3 overflow-hidden"><div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div></div>
                                    </>
                                  ) : (
                                    <>
                                      <UploadCloud className="w-6 h-6 text-zinc-500 mb-2 group-hover:text-emerald-400 transition-colors" />
                                      <span className="text-xs text-zinc-400 font-medium">Tap to select .mp4 file</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-1.5 relative">
                        <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">Execution Protocol</label>
                        <div className="relative group">
                          <div className="absolute top-4 left-0 pl-4 pointer-events-none"><FileText className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" /></div>
                          <textarea value={newExInstructions} onChange={e => setNewExInstructions(e.target.value)} placeholder="Keep slight bend in elbows..." rows={3} className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-sm md:text-base text-white placeholder-zinc-700 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all shadow-inner resize-none custom-scrollbar" required></textarea>
                        </div>
                      </div>

                      <button type="submit" disabled={isUploading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-zinc-500 text-white font-black py-4 md:py-5 rounded-xl md:rounded-2xl active:scale-[0.98] transition-all uppercase tracking-widest text-xs md:text-sm mt-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 touch-manipulation">
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> Compile & Deploy
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-5 hidden lg:block relative">
                    <div className="sticky top-24">
                      <div className="flex items-center gap-2 mb-4">
                        <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live Matrix Render</h3>
                      </div>
                      <div className="relative rounded-[2.5rem] overflow-hidden border border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.15)] aspect-[4/5] bg-zinc-950 transition-all duration-500 group">
                        {newExVideo ? (
                          <video src={newExVideo} autoPlay loop muted playsInline className="absolute inset-0 object-cover w-full h-full opacity-80" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-500/20">
                            <Activity className="w-16 h-16 mb-4 opacity-50 animate-pulse" />
                            <span className="text-[10px] uppercase tracking-widest font-bold">Awaiting Visual Link</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-full p-8 pointer-events-none">
                          <span className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[9px] text-emerald-400 uppercase tracking-widest font-bold mb-3">{newExEquipment || "Equipment"}</span>
                          <h3 className="text-3xl font-black text-white leading-tight mb-1">{newExName || "EXERCISE DESIGNATION"}</h3>
                          <p className="text-sm text-zinc-400 font-medium">{newExMachine || "Required Hardware"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= RECORDS MODE ================= */}
            {appMode === "records" && (
              <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl md:text-3xl font-black text-white">Archive</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">{activeProfile}'s Data</span>
                </div>
                {sortedDates.length === 0 ? (
                  <div className="border border-dashed border-zinc-800 rounded-[2rem] p-12 md:p-16 text-center mx-1 md:mx-0">
                    <CalendarDays className="w-10 h-10 md:w-12 md:h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs md:text-sm">No Data Logged</p>
                  </div>
                ) : (
                  sortedDates.map(date => {
                    const exercisesForThisDay = groupByExercise(groupedByDate[date]);
                    const { weekday, dateDisplay } = formatRecordDate(date);

                    return (
                      <div key={date} className="bg-[#09090b] border border-white/10 rounded-[2rem] overflow-hidden shadow-xl">
                        <div className="bg-white/5 border-b border-white/5 p-4 px-5 md:px-8">
                          <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <span className="text-indigo-400">{weekday}</span>
                            <span className="text-zinc-600">•</span>
                            <span>{dateDisplay}</span>
                          </h3>
                        </div>
                        <div className="p-4 md:p-8 space-y-8 md:space-y-10">
                          {Object.keys(exercisesForThisDay).map(exerciseName => {
                            const activeLibraryEx = library.find(ex => ex.name === exerciseName);
                            const videoUrl = activeLibraryEx?.videoUrl;

                            return (
                              <div key={exerciseName}>
                                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-5 px-1 md:px-0">
                                  {videoUrl ? (
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border border-white/10 bg-zinc-950 flex-shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                                      <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80" />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl border border-white/10 bg-zinc-900/50 flex items-center justify-center flex-shrink-0">
                                      <Dumbbell className="w-5 h-5 md:w-6 md:h-6 text-zinc-600" />
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-base md:text-lg font-black text-white leading-tight mb-0.5">{exerciseName}</h4>
                                    <span className="text-[8px] md:text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                                      {exercisesForThisDay[exerciseName][0].equipment} • {exercisesForThisDay[exerciseName].length} Sets
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {exercisesForThisDay[exerciseName].map(set => (
                                    <div key={set.id} className="flex items-center justify-between bg-black/30 border border-white/5 p-3 md:p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                                      <div className="flex items-center gap-4 md:gap-6">
                                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] md:text-xs font-black text-zinc-400">
                                          {set.setNumber}
                                        </div>
                                        <div className="text-white font-bold text-sm md:text-base">
                                          {set.reps} <span className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-widest">Reps</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 md:gap-6">
                                        <div className="text-indigo-400 font-black text-sm md:text-base flex items-center gap-1.5">
                                          {set.weight} <span className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-widest">kg</span>
                                          {(set.equipment === "Dumbbells" || set.equipment === "Plates") ? <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded ml-0.5">x2</span> : null}
                                        </div>
                                        <button onClick={() => triggerDeleteLog(set.id)} className="p-2 -mr-2 text-zinc-600 hover:text-red-500 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}