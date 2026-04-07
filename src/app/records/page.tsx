"use client";
import { useState, useRef } from "react";
import axios from "axios";
import { CalendarDays, Dumbbell, Trash2, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import SharedUI from "@/components/SharedUI";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExerciseHistoryModal from "@/components/ExerciseHistoryModal";
import { useAuthAndData, formatRecordDate, LoggedSet, API_URL, ExerciseDef } from "@/lib/store";

const RecordThumbnail = ({ videoUrl }: { videoUrl?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handleMouseEnter = () => { if (window.innerWidth > 768 && videoRef.current) videoRef.current.play().catch(() => {}); };
  const handleMouseLeave = () => { if (window.innerWidth > 768 && videoRef.current) videoRef.current.pause(); };

  if (!videoUrl) return (
    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl border border-white/10 bg-zinc-900/50 flex items-center justify-center flex-shrink-0">
      <Dumbbell className="w-5 h-5 md:w-6 md:h-6 text-zinc-600" />
    </div>
  );

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border border-white/10 bg-zinc-950 flex-shrink-0 relative group">
      <video ref={videoRef} src={videoUrl} loop muted playsInline preload="metadata" className="w-full h-full object-cover opacity-80" />
    </div>
  );
};

export default function RecordsPage() {
  const { activeProfile, library, logs, fetchLogs } = useAuthAndData();
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", confirmText: "Confirm", action: () => {} });
  
  const [selectedEx, setSelectedEx] = useState<ExerciseDef | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const triggerDeleteLog = (logId: string) => {
    setConfirmDialog({
      isOpen: true, title: "Erase Set Data?", message: "Permanently delete this set from your history?", confirmText: "Erase",
      action: async () => { 
        try {
          await axios.delete(`${API_URL}/workoutLogs/${logId}`); 
          fetchLogs(activeProfile); 
          setConfirmDialog(prev => ({ ...prev, isOpen: false })); 
          toast.success("Record erased."); 
        } catch (error) { toast.error("Failed to delete record."); }
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

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans relative pb-28 md:pb-12 overflow-x-hidden">
      <SharedUI activeProfile={activeProfile} />
      <ConfirmDialog dialog={confirmDialog as any} setDialog={setConfirmDialog} />
      
      <ExerciseHistoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        exercise={selectedEx} 
        logs={logs} 
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-2 md:mt-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl md:text-3xl font-black text-white">Archive</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">{activeProfile}'s Data</span>
          </div>
          
          {sortedDates.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-[2rem] p-12 md:p-16 text-center">
              <CalendarDays className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No Data Logged</p>
            </div>
          ) : (
            sortedDates.map(date => {
              const exercisesForThisDay = groupByExercise(groupedByDate[date]);
              const { weekday, dateDisplay } = formatRecordDate(date);

              return (
                <div key={date} className="bg-[#09090b] border border-white/10 rounded-[2rem] overflow-hidden shadow-xl">
                  <div className="bg-white/5 border-b border-white/5 p-4 px-5 md:px-8">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <span className="text-indigo-400">{weekday}</span><span className="text-zinc-600">•</span><span>{dateDisplay}</span>
                    </h3>
                  </div>
                  
                  <div className="p-4 md:p-8 space-y-10">
                    {Object.keys(exercisesForThisDay).map(exerciseName => {
                      const activeLibraryEx = library.find(ex => ex.name === exerciseName);
                      const videoUrl = activeLibraryEx?.videoUrl;

                      return (
                        <div key={exerciseName}>
                          <div 
                            onClick={() => {
                              if (activeLibraryEx) {
                                setSelectedEx(activeLibraryEx);
                                setIsModalOpen(true);
                              }
                            }}
                            className="flex items-center justify-between group cursor-pointer active:opacity-60 transition-opacity mb-4"
                          >
                            <div className="flex items-center gap-3 md:gap-4">
                              <RecordThumbnail videoUrl={videoUrl} />
                              <div>
                                <h4 className="text-base md:text-lg font-black text-white group-hover:text-indigo-400 transition-colors">{exerciseName}</h4>
                                <span className="text-[8px] md:text-[10px] uppercase font-bold text-zinc-500">
                                  {exercisesForThisDay[exerciseName][0].equipment} • {exercisesForThisDay[exerciseName].length} Sets
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-white transition-colors" />
                          </div>

                          <div className="space-y-2">
                            {exercisesForThisDay[exerciseName].map(set => (
                              <div key={set.id} className="flex items-center justify-between bg-[#0a0a0a] border border-white/5 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-4">
                                  <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-400">{set.setNumber}</div>
                                  <div className="text-white font-bold text-sm">{set.reps} <span className="text-zinc-500 text-[9px] uppercase">Reps</span></div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-indigo-400 font-black text-sm flex items-center">
                                    {set.weight} <span className="text-zinc-500 text-[9px] ml-0.5 mr-1">kg</span>
                                    {/* --- X2 BADGE RESTORED --- */}
                                    {(set.equipment?.includes("Dumbbells") || set.equipment === "Plates") && (
                                      <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">x2</span>
                                    )}
                                  </div>
                                  <button onClick={() => triggerDeleteLog(set.id)} className="p-2 -mr-2 text-zinc-600 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
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
      </main>
    </div>
  );
}