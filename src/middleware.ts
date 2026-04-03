import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('forge_session')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  // If trying to access the app without a session, kick them to /login
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If they already have a session and try to view the login page, push them into the app
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Only protect the main page and the login page
export const config = {
  matcher: ['/', '/login'],
};