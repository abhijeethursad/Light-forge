import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WorkoutLog from '@/models/WorkoutLog';

export async function GET(request: Request) {
  await dbConnect();
  
  // Look at the URL to see who is asking for data (e.g., ?user=Abhi)
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');

  // If a user is specified, only find their logs. Otherwise, return none.
  const query = user ? { user: user } : {};
  const logs = await WorkoutLog.find(query);
  
  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  await dbConnect();
  const data = await request.json();
  const newLog = await WorkoutLog.create(data);
  return NextResponse.json(newLog);
}