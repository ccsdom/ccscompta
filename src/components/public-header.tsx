import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/logo';

const navLinks = [
  { href: '/fonctionnalites', label: 'Fonctionnalités' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/securite', label: 'Sécurité' },
  { href: '/blog', label: 'Ressources' },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-semibold text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Logo className="h-5 w-5" />
          </span>
          <span className="text-base font-black tracking-tight">CCS Compta</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-blue-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/connexion" className="text-sm font-semibold text-slate-700 transition hover:text-blue-700">
            Se connecter
          </Link>
          <Link
            href="/connexion"
            className="inline-flex h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            Demander une démo
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </summary>
          <div className="absolute right-0 mt-3 hidden w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl group-open:block">
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {link.label}
                </Link>
              ))}
              <Link href="/connexion" className="mt-2 rounded-lg bg-blue-600 px-3 py-3 text-center text-sm font-bold text-white">
                Demander une démo
              </Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
