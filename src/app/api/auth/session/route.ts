import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json({ error: 'Missing ID Token' }, { status: 400 });
        }

        // Set session expiration to 5 days
        const expiresIn = 60 * 60 * 24 * 5 * 1000;

        // Verify the ID token first
        const decodedToken = await auth.verifyIdToken(idToken);
        
        // Create the session cookie
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        // Set the cookie
        const response = NextResponse.json({ status: 'success' });
        response.cookies.set({
            name: '__session', // Firebase Hosting required name
            value: sessionCookie,
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        return response;
    } catch (error) {
        console.error('Session Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
