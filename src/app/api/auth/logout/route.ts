import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function POST() {
    const response = NextResponse.json({ status: 'success' });
    
    // Remove the session cookie
    response.cookies.set({
        name: '__session',
        value: '',
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
    });

    return response;
}
