import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exercise from '@/models/Exercise';

export async function GET() {
  await dbConnect();
  const exercises = await Exercise.find({});
  return NextResponse.json(exercises);
}

export async function POST(request: Request) {
  await dbConnect();
  const data = await request.json();
  const newExercise = await Exercise.create(data);
  return NextResponse.json(newExercise);
}