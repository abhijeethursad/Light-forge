"use client";
import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Dumbbell, CheckCircle2, Link2, FileText, Settings2, Eye, ChevronDown, Type, UploadCloud } from "lucide-react";
import { toast } from "react-hot-toast";
import SharedUI from "@/components/SharedUI";
import { useAuthAndData, allMuscleGroups, allEquipmentTypes, ExerciseDef, API_URL } from "@/lib/store";

const PremiumSelect = ({ value, onChange, options, icon: Icon, placeholder, label }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="space-y-1.5 relative transform-gpu z-20">
      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">{label}</label>
      <div className="relative group">
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-sm md:text-base text-white focus:border-emerald-500/50 outline-none transition-all shadow-inner">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Icon className={`w-4 h-4 transition-colors ${isOpen ? 'text-emerald-400' : 'text-zinc-500'}`} /></div>
          <span className="font-medium">{value || placeholder}</span>
          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-40 w-full mt-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {options.map((opt: string) => (
                    <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`px-4 py-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${value === opt ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'hover:bg-white/5 text-zinc-300 hover:text-white'}`}>
                      {opt}{value === opt && <CheckCircle2 className="w-4 h-4" />}
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

export default function ForgePage() {
  const { activeProfile, fetchLibrary } = useAuthAndData();
  const [newExName, setNewExName] = useState("");
  const [newExMachine, setNewExMachine] = useState("");
  const [newExMuscle, setNewExMuscle] = useState("Chest");
  const [newExEquipment, setNewExEquipment] = useState("Barbell");
  const [newExVideo, setNewExVideo] = useState("");
  const [newExInstructions, setNewExInstructions] = useState("");
  const [videoMode, setVideoMode] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true); setUploadProgress(0);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
    if (!cloudName || !preset) { toast.error("Config missing"); setIsUploading(false); return; }

    const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", preset);
    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, formData, {
        onUploadProgress: (ev) => setUploadProgress(Math.round((ev.loaded * 100) / (ev.total || 100)))
      });
      setNewExVideo(res.data.secure_url); toast.success("Video synced to cloud.");
    } catch (error) { toast.error("Upload failed."); } 
    finally { setIsUploading(false); }
  };

  const handleAddNewExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExVideo) { toast.error("Visual Feed required."); return; }
    const newExercise: ExerciseDef = { id: "ex_" + Date.now().toString(), name: newExName, machineName: newExMachine, muscleGroup: newExMuscle, equipment: newExEquipment, videoUrl: newExVideo, instructions: newExInstructions };
    try {
      await axios.post(`${API_URL}/exerciseLibrary`, newExercise);
      fetchLibrary(); toast.success(`${newExName} Forged`, { icon: '⚒️' });
      window.location.href = "/"; // Send back to home once added
    } catch (error) { toast.error("Failed to forge exercise."); }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white relative pb-28 md:pb-12 overflow-x-hidden">
      <SharedUI activeProfile={activeProfile} />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-2 md:mt-4 relative z-10">
        <div className="max-w-6xl mx-auto px-1 md:px-2 mt-2 md:mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <div className="text-center md:text-left">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]"><Settings2 className="w-6 h-6 stroke-[2]" /></div>
                <h2 className="text-2xl md:text-4xl font-black text-white mb-2 leading-tight tracking-tight">Forge Hardware</h2>
                <p className="text-xs md:text-sm text-zinc-400 px-4 md:px-0">Configure parameters to expand your training matrix.</p>
              </div>
              <form onSubmit={handleAddNewExercise} className="space-y-4 md:space-y-5 bg-zinc-900/20 backdrop-blur-md border border-white/5 p-5 md:p-8 rounded-[2rem] shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 relative z-30">
                  <div className="space-y-1.5 relative">
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">Designation</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Type className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" /></div>
                      <input type="text" value={newExName} onChange={e => setNewExName(e.target.value)} placeholder="e.g. Lateral Raise" className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-sm md:text-base text-white placeholder-zinc-700 focus:border-emerald-500/50 outline-none transition-all shadow-inner" required />
                    </div>
                  </div>
                  <PremiumSelect label="Target Sector" value={newExMuscle} onChange={setNewExMuscle} options={allMuscleGroups} icon={Activity} placeholder="Select Muscle" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 relative z-20">
                  <div className="space-y-1.5 relative">
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">Machine Class</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Activity className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" /></div>
                      <input type="text" value={newExMachine} onChange={e => setNewExMachine(e.target.value)} placeholder="e.g. Incline Bench" className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-sm md:text-base text-white placeholder-zinc-700 focus:border-emerald-500/50 outline-none transition-all shadow-inner" required />
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
                  {videoMode === 'url' ? (
                    <div className="relative group animate-in fade-in zoom-in duration-200">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Link2 className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" /></div>
                      <input type="text" value={newExVideo} onChange={e => setNewExVideo(e.target.value)} placeholder="https://..." className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-sm md:text-base text-white placeholder-zinc-700 focus:border-emerald-500/50 outline-none transition-all shadow-inner" />
                    </div>
                  ) : (
                    <div className="relative group animate-in fade-in zoom-in duration-200">
                      <div className="relative flex items-center justify-center w-full bg-zinc-900/50 backdrop-blur-md border border-dashed border-white/20 rounded-xl md:rounded-2xl py-6 hover:border-emerald-500/50 transition-all overflow-hidden">
                        <input type="file" accept="video/*" onChange={handleVideoUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                        <div className="flex flex-col items-center pointer-events-none">
                          {isUploading ? (
                            <><Activity className="w-6 h-6 text-emerald-400 mb-2 animate-spin" /><span className="text-xs text-emerald-400 font-bold">{uploadProgress}% Uploading...</span></>
                          ) : (
                            <><UploadCloud className="w-6 h-6 text-zinc-500 mb-2 group-hover:text-emerald-400 transition-colors" /><span className="text-xs text-zinc-400 font-medium">Tap to select .mp4 file</span></>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 relative">
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">Execution Protocol</label>
                  <textarea value={newExInstructions} onChange={e => setNewExInstructions(e.target.value)} placeholder="Keep slight bend in elbows..." rows={3} className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-sm md:text-base text-white placeholder-zinc-700 focus:border-emerald-500/50 outline-none transition-all shadow-inner resize-none custom-scrollbar" required></textarea>
                </div>
                <button type="submit" disabled={isUploading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-black py-4 md:py-5 rounded-xl md:rounded-2xl active:scale-[0.98] transition-all uppercase tracking-widest text-xs md:text-sm mt-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> Compile & Deploy</button>
              </form>
            </div>
            <div className="lg:col-span-5 hidden lg:block relative">
              <div className="sticky top-24">
                <div className="flex items-center gap-2 mb-4"><Eye className="w-4 h-4 text-emerald-400 animate-pulse" /><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live Matrix Render</h3></div>
                <div className="relative rounded-[2.5rem] overflow-hidden border border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.15)] aspect-[4/5] bg-zinc-950 group">
                  {newExVideo ? <video src={newExVideo} autoPlay loop muted playsInline className="absolute inset-0 object-cover w-full h-full opacity-80" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-500/20"><Activity className="w-16 h-16 mb-4 opacity-50 animate-pulse" /><span className="text-[10px] uppercase tracking-widest font-bold">Awaiting Visual Link</span></div>}
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
      </main>
    </div>
  );
}