import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const hasTherapistCookies = (request: NextRequest) => {
  const accessToken = request.cookies.get('therapistAccessToken')?.value;
  const refreshToken = request.cookies.get('therapistRefreshToken')?.value;
  return Boolean(accessToken || refreshToken);
};

// Try /therapist-auth/me. If the access token is expired (401), silently refresh
// it first. Returns whether valid and any new cookies from the refresh.
const resolveTherapistAuth = async (
  request: NextRequest,
): Promise<{ isValid: boolean; setCookieHeader?: string }> => {
  const cookieHeader = request.headers.get('cookie') || '';

  try {
    const meRes = await fetch(`${getApiBase()}/therapist-auth/me`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });

    if (meRes.ok) return { isValid: true };

    // Non-401 (e.g. 403 suspended) — not recoverable.
    if (meRes.status !== 401) return { isValid: false };

    // Access token expired — try the refresh endpoint.
    const refreshRes = await fetch(`${getApiBase()}/therapist-auth/refresh`, {
      method: 'POST',
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!refreshRes.ok) return { isValid: false };

    const setCookieHeader = refreshRes.headers.get('set-cookie') ?? undefined;
    return { isValid: true, setCookieHeader };
  } catch {
    return { isValid: false };
  }
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasTherapistCookies(request);

  if (pathname === '/login') {
    if (isAuthenticated) {
      const { isValid } = await resolveTherapistAuth(request);
      if (isValid) return NextResponse.redirect(new URL('/availability', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { isValid, setCookieHeader } = await resolveTherapistAuth(request);

  if (!isValid) {
    return NextResponse.redirect(new URL('/login?reason=unauthorized', request.url));
  }

  const response = NextResponse.next();
  // Forward refreshed cookies so the browser gets the new access token
  // without the therapist being logged out every 15 minutes.
  if (setCookieHeader) {
    response.headers.set('set-cookie', setCookieHeader);
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
