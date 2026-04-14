import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const hasAuthCookies = (request: NextRequest) => {
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;
    return !!(accessToken || refreshToken);
};

// Try /auth/me. If the access token is expired (401), silently refresh it first,
// then re-check. Returns the role string on success, null on failure.
// Also returns any new Set-Cookie header from the refresh so the browser
// gets updated tokens without being evicted.
const resolveAdminRole = async (
    request: NextRequest,
): Promise<{ isAdmin: boolean; setCookieHeader?: string }> => {
    const cookieHeader = request.headers.get('cookie') || '';

    try {
        const meRes = await fetch(`${getApiBase()}/auth/me`, {
            headers: { cookie: cookieHeader },
            cache: 'no-store',
        });

        if (meRes.ok) {
            const me = await meRes.json();
            return { isAdmin: me?.role === 'admin' };
        }

        // Non-401 errors (403, 500, …) — not an admin / not recoverable.
        if (meRes.status !== 401) return { isAdmin: false };

        // Access token expired — try the refresh endpoint.
        const refreshRes = await fetch(`${getApiBase()}/auth/refresh`, {
            method: 'POST',
            headers: { cookie: cookieHeader },
            cache: 'no-store',
        });

        if (!refreshRes.ok) return { isAdmin: false };

        // The refresh response body contains the formatted user (including role).
        const refreshData = await refreshRes.json();
        const setCookieHeader = refreshRes.headers.get('set-cookie') ?? undefined;

        return {
            isAdmin: refreshData?.role === 'admin',
            setCookieHeader,
        };
    } catch {
        return { isAdmin: false };
    }
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAuthenticated = hasAuthCookies(request);

    if (pathname === '/login') {
        if (isAuthenticated) {
            const { isAdmin } = await resolveAdminRole(request);
            if (isAdmin) return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const { isAdmin, setCookieHeader } = await resolveAdminRole(request);

    if (!isAdmin) {
        return NextResponse.redirect(new URL('/login?reason=unauthorized', request.url));
    }

    const response = NextResponse.next();
    // Forward refreshed cookies so the browser gets the new access token
    // without the user having to log in again.
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
