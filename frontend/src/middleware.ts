import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const url = request.nextUrl.clone();

    // If no token, redirect to login for protected routes
    if (!token) {
        if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }

    try {
        // Decode base64 payload to get role
        // Edge runtime compatible base64 decode with base64url support
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
        const payload = JSON.parse(atob(padded));

        if (url.pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    } catch (e) {
        if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/dashboard')) {
            // Clear invalid token string
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/dashboard/:path*'],
};
