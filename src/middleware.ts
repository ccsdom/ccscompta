import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // Authorization is enforced by Firebase Auth claims and security rules.
  // Middleware stays neutral to avoid trusting client-editable cookies.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
