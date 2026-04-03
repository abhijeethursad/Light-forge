import mongoose from 'mongoose';

const ExerciseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  machineName: { type: String, required: true },
  muscleGroup: { type: String, required: true },
  equipment: { type: String, required: true },
  videoUrl: { type: String, required: true },
  instructions: { type: String, required: true },
});

export default mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema);