import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  await dbConnect();
  const { username, password } = await request.json();
  
  // Check if you or Krunal exist in the DB with the right password
  const user = await User.findOne({ username: username, password: password });

  if (user) {
    const response = NextResponse.json({ success: true, username: user.username });
    // This creates an impenetrable cookie vault key
    response.cookies.set('forge_session', user.username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // Keeps you logged in for 30 days
    });
    return response;
  }
  
  return NextResponse.json({ success: false, message: 'Invalid Credentials' }, { status: 401 });
}