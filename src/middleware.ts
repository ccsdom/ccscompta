import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const roleCookie = request.cookies.get('userRole');
  const role = roleCookie?.value || '';
  const path = request.nextUrl.pathname;

  if (path.startsWith('/dashboard')) {
    // Redirection si aucun cookie de rôle (non connecté)
    if (!roleCookie && path !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protection rigoureuse des routes par rôle
    if (path.startsWith('/dashboard/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/my-documents', request.url));
    }
    
    // Le comptable et l'admin peuvent accéder aux ressources comptables
    if (path.startsWith('/dashboard/accountant') && !['admin', 'accountant'].includes(role)) {
        return NextResponse.redirect(new URL('/dashboard/my-documents', request.url));
    }
    
    // La secrétaire peut accéder à un espace plus limité
    if (path.startsWith('/dashboard/secretary') && !['admin', 'secretary'].includes(role)) {
        return NextResponse.redirect(new URL('/dashboard/my-documents', request.url));
    }
    
    // Un client ne doit pas avoir accès aux vues globales 'clients' ou 'documents'
    if ((path === '/dashboard/clients' || path === '/dashboard/documents') && role === 'client') {
        return NextResponse.redirect(new URL('/dashboard/my-documents', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
