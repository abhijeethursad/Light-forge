"use client";
import { useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Weight, Hash, Activity, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ExerciseDef, LoggedSet, formatRecordDate } from "@/lib/store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  exercise: ExerciseDef | null;
  logs: LoggedSet[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#09090b]/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{label}</p>
        <div className="flex items-center gap-3">
          <p className="text-indigo-400 font-black text-lg flex items-center gap-1">
            {data.weight} <span className="text-[10px] text-zinc-400 uppercase">kg</span>
          </p>
          <span className="text-zinc-600 font-black">×</span>
          <p className="text-emerald-400 font-black text-lg flex items-center gap-1">
            {data.reps} <span className="text-[10px] text-zinc-400 uppercase">reps</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function ExerciseHistoryModal({ isOpen, onClose, exercise, logs }: Props) {
  if (!exercise) return null;

  const history = logs
    .filter((log) => log.exerciseName === exercise.name)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const chartData = useMemo(() => {
    if (history.length === 0) return [];
    
    const grouped = history.reduce((acc: any, log) => {
      if (!acc[log.date]) acc[log.date] = [];
      acc[log.date].push(log);
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, dayLogs]: any) => {
      const bestSet = dayLogs.reduce((best: any, current: any) => {
        if (current.weight > best.weight) return current;
        if (current.weight === best.weight && current.reps > best.reps) return current;
        return best;
      }, dayLogs[0]);

      const d = new Date(date);
      return {
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: d.getTime(),
        weight: bestSet.weight,
        reps: bestSet.reps
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [history]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
          {/* Backdrop (Clicking this also closes the modal) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 500) onClose();
            }}
            className="bg-[#09090b] w-full max-w-2xl h-[95vh] sm:h-[85vh] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 flex flex-col shadow-2xl transform-gpu will-change-transform"
          >
            {/* --- FIX 2: NATIVE IOS SWIPE DRAG HANDLE --- */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-50 sm:hidden pointer-events-none" />

            {/* --- FIX 1: FORCED ROUNDED CORNERS ON VIDEO CONTAINER TO STOP BLEEDING --- */}
            <div className="relative w-full h-56 sm:h-72 bg-black flex-shrink-0 overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem]">
              
              {/* Blurred Ambient Background */}
              {exercise.videoUrl && (
                <video src={exercise.videoUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-30 blur-2xl scale-125 pointer-events-none" />
              )}

              {/* Main Video */}
              {exercise.videoUrl ? (
                <video src={exercise.videoUrl} autoPlay loop muted playsInline className="relative z-10 w-full h-full object-contain opacity-90 pointer-events-none" />
              ) : (
                <div className="relative z-10 w-full h-full flex items-center justify-center bg-zinc-900/50">
                  <Activity className="w-12 h-12 text-zinc-700" />
                </div>
              )}
              
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 sm:bottom-6 left-6 right-6 z-20 pointer-events-none">
                <p className="text-indigo-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-1">Target Sector: {exercise.muscleGroup}</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-none">{exercise.name}</h2>
              </div>
            </div>

            {/* Scrollable Content (Graph + History) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2 pb-12 space-y-8">
              
              {/* --- DUAL TELEMETRY GRAPH --- */}
              {chartData.length > 1 && (
                <div className="pt-4 border-b border-white/5 pb-8">
                  {/* Header & Legend */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Progression Curve</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-400"/>
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Load</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"/>
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Reps</span>
                      </div>
                    </div>
                  </div>

                  {/* --- FIX 3: ADDED PADDING AND MARGIN SO GRAPH NEVER CUTS OFF --- */}
                  <div className="h-[160px] sm:h-[180px] w-full flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorReps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        
                        {/* Added padding to push the first and last dots inward */}
                        <XAxis dataKey="dateStr" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} dy={10} minTickGap={20} padding={{ left: 15, right: 15 }} />
                        
                        <YAxis yAxisId="left" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} width={35} />
                        <YAxis yAxisId="right" orientation="right" hide={true} />
                        
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                        
                        <Area yAxisId="left" type="monotone" dataKey="weight" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" activeDot={{ r: 6, fill: "#818cf8", stroke: "#09090b", strokeWidth: 4 }} />
                        <Area yAxisId="right" type="monotone" dataKey="reps" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorReps)" activeDot={{ r: 6, fill: "#34d399", stroke: "#09090b", strokeWidth: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* --- HISTORY LIST --- */}
              <div>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">Execution Log</h3>
                {history.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">No Records Found</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {history.reduce((acc: any[], log) => {
                      const lastDay = acc[acc.length - 1];
                      if (lastDay && lastDay.date === log.date) {
                        lastDay.sets.push(log);
                      } else {
                        acc.push({ date: log.date, sets: [log] });
                      }
                      return acc;
                    }, []).map((dayGroup) => {
                      const { weekday, dateDisplay } = formatRecordDate(dayGroup.date);
                      return (
                        <div key={dayGroup.date} className="relative pl-6 border-l border-white/5 space-y-3">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500/50 ring-4 ring-[#09090b]" />
                          
                          <div className="flex flex-col mb-3">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{weekday}</span>
                            <span className="text-xs font-bold text-zinc-600">{dateDisplay}</span>
                          </div>

                          <div className="grid gap-2">
                            {dayGroup.sets.sort((a: any, b: any) => a.setNumber - b.setNumber).map((set: LoggedSet) => (
                              <div key={set.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
                                <div className="flex items-center gap-4">
                                  <span className="w-5 text-[10px] font-black text-zinc-600">S{set.setNumber}</span>
                                  <div className="flex items-center gap-1.5">
                                    <Weight className="w-3 h-3 text-indigo-400" />
                                    <span className="text-sm font-bold text-white flex items-center">
                                      {set.weight}<span className="text-[10px] text-zinc-500 ml-0.5 mr-1">kg</span>
                                      {(set.equipment?.includes("Dumbbells") || set.equipment === "Plates") && (
                                        <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">x2</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                  <Hash className="w-3 h-3 text-emerald-400" />
                                  <span className="text-sm font-bold text-white">{set.reps}<span className="text-[10px] text-zinc-500 ml-0.5">reps</span></span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}