import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const hasAuthCookies = (request: NextRequest) => {
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;
    return !!(accessToken || refreshToken);
};

const isAdminFromBackend = async (request: NextRequest) => {
    try {
        const meRes = await fetch(`${getApiBase()}/auth/me`, {
            method: 'GET',
            headers: {
                cookie: request.headers.get('cookie') || '',
            },
            cache: 'no-store',
        });
        if (!meRes.ok) return false;
        const me = await meRes.json();
        return me?.role === 'admin';
    } catch {
        return false;
    }
};

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAuthenticated = hasAuthCookies(request);

    if (pathname === '/login') {
        if (isAuthenticated && await isAdminFromBackend(request)) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!await isAdminFromBackend(request)) {
        return NextResponse.redirect(new URL('/login?reason=unauthorized', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
