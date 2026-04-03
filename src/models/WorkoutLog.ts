import mongoose from 'mongoose';

const WorkoutLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user: { type: String, required: true }, // <-- NEW FIELD
  exerciseName: { type: String, required: true },
  setNumber: { type: Number, required: true },
  reps: { type: Number, required: true },
  weight: { type: Number, required: true },
  muscleGroup: { type: String, required: true },
  equipment: { type: String, required: true },
  date: { type: String, required: true },
});

export default mongoose.models.WorkoutLog || mongoose.model('WorkoutLog', WorkoutLogSchema);