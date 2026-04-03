import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies(); // <--- Added await here
  const session = cookieStore.get('forge_session')?.value;
  return NextResponse.json({ username: session || null });
}