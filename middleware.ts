import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

const PORTAL_ROUTES = {
  STUDENT: '/portal/student',
  LECTURER: '/portal/lecturer',
  OFFICIAL: '/portal/official',
  ADMIN: '/portal/admin',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/public') ||
    pathname === '/login' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('uniqualis_session')?.value;

  if (!sessionToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifyToken(sessionToken);
    
    if (!payload) {
      throw new Error('Invalid token');
    }

    const userRole = payload.role as string;

    if ((pathname.startsWith(PORTAL_ROUTES.STUDENT) || pathname.startsWith('/api/student')) && userRole !== 'STUDENT') {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    if ((pathname.startsWith(PORTAL_ROUTES.LECTURER) || pathname.startsWith('/api/lecturer')) && userRole !== 'LECTURER') {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    if ((pathname.startsWith(PORTAL_ROUTES.OFFICIAL) || pathname.startsWith('/api/official')) && userRole !== 'OFFICIAL' && userRole !== 'ADMIN') {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    if ((pathname.startsWith(PORTAL_ROUTES.ADMIN) || pathname.startsWith('/api/admin')) && userRole !== 'ADMIN') {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub as string);
    requestHeaders.set('x-user-role', userRole);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
