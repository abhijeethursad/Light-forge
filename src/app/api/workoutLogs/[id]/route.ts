import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WorkoutLog from '@/models/WorkoutLog';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  await WorkoutLog.findOneAndDelete({ id: params.id });
  return NextResponse.json({ message: "Deleted" });
}