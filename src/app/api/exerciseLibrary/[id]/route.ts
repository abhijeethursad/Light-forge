import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exercise from '@/models/Exercise';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  await Exercise.findOneAndDelete({ id: params.id });
  return NextResponse.json({ message: "Deleted" });
}