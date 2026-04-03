import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exercise from '@/models/Exercise';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params; // <--- Added await here
  await dbConnect();
  await Exercise.findOneAndDelete({ id: resolvedParams.id });
  return NextResponse.json({ message: "Deleted" });
}