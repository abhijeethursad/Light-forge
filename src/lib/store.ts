"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ExerciseDef { id: string; name: string; machineName: string; muscleGroup: string; equipment: string; videoUrl: string; instructions: string; }
export interface LoggedSet { id: string; user: string; exerciseName: string; setNumber: number; reps: number; weight: number; muscleGroup: string; equipment: string; date: string; }

export const allMuscleGroups = ["Chest", "Back", "Legs", "Shoulders", "Biceps", "Triceps", "Core", "Forearm", "Calves"];
export const allEquipmentTypes = ["Barbell", "Single Dumbbell", "Dumbbells", "Machine", "Cable", "Bodyweight", "Smith Machine", "Kettlebell", "Single Plate", "Plates"];

export const weeklySplit: Record<string, string[]> = {
  "Monday": ["Chest", "Triceps"], "Tuesday": ["Back", "Biceps", "Forearm"], "Wednesday": ["Legs", "Shoulders", "Calves"],
  "Thursday": ["Chest", "Triceps"], "Friday": ["Back", "Biceps", "Forearm"], "Saturday": ["Legs", "Shoulders", "Calves"], 
  "Sunday": ["Rest"], "Anytime": allMuscleGroups 
};
export const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Anytime"];

export const formatRecordDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return { weekday: d.toLocaleDateString('en-US', { weekday: 'long' }), dateDisplay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
};

export const getTrainingZone = (reps: number) => {
  if (reps <= 5) return { label: "Raw Strength", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
  if (reps <= 12) return { label: "Hypertrophy", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  return { label: "Endurance", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
};

// Custom Hook to manage Auth and Data across all pages
export function useAuthAndData() {
  const [activeProfile, setActiveProfile] = useState<string>("");
  const [library, setLibrary] = useState<ExerciseDef[]>([]);
  const [logs, setLogs] = useState<LoggedSet[]>([]);

  const fetchLogs = (user: string) => axios.get(`${API_URL}/workoutLogs?user=${user}`).then(res => setLogs(res.data)).catch(console.error);
  const fetchLibrary = () => axios.get(`${API_URL}/exerciseLibrary`).then(res => setLibrary(res.data)).catch(console.error);

  useEffect(() => {
    axios.get('/api/auth/me')
      .then(res => {
        if (res.data.username) { setActiveProfile(res.data.username); fetchLogs(res.data.username); } 
        else { window.location.href = '/login'; }
      })
      .catch(() => { window.location.href = '/login'; });
    fetchLibrary();
  }, []);

  return { activeProfile, library, logs, fetchLogs, fetchLibrary };
}