import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const hasTherapistCookies = (request: NextRequest) => {
  const accessToken = request.cookies.get('therapistAccessToken')?.value;
  const refreshToken = request.cookies.get('therapistRefreshToken')?.value;
  return Boolean(accessToken || refreshToken);
};

const isTherapistFromBackend = async (request: NextRequest) => {
  try {
    const meRes = await fetch(`${getApiBase()}/therapist-auth/me`, {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
      cache: 'no-store',
    });
    return meRes.ok;
  } catch {
    return false;
  }
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasTherapistCookies(request);

  if (pathname === '/login') {
    if (isAuthenticated && await isTherapistFromBackend(request)) {
      return NextResponse.redirect(new URL('/availability', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!await isTherapistFromBackend(request)) {
    return NextResponse.redirect(new URL('/login?reason=unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

