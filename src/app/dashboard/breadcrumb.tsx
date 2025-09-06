
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbNameMap: { [key: string]: string } = {
  'dashboard': 'Tableau de bord',
  'clients': 'Clients',
  'new': 'Nouveau Client',
  'documents': 'Documents',
  'analytics': 'Analyse Détaillée',
  'settings': 'Paramètres (Comptable)',
  'accountant': 'Tableau de Bord',
  'admin': 'Tableau de Bord Admin',
  'secretary': 'Tableau de Bord Secrétaire',
  'my-documents': 'Tableau de bord',
  'scan': 'Scanner un document',
  'my-analytics': 'Mon Analyse',
  'my-settings': 'Paramètres',
  'billing': 'Facturation',
  'my-invoices': 'Mes Factures',
  'reporting': 'Rapports',
  'cabinets': 'Gestion des Cabinets',
  'support': 'Aide & Support',
};

const mockClients = [
    { id: 'alpha', name: 'Entreprise Alpha'},
    { id: 'beta', name: 'Bêta SARL'},
    { id: 'gamma', name: 'Gamma Inc.'},
    { id: 'delta', name: 'Delta Industries'},
    { id: 'epsilon', name: 'Epsilon Global'},
];

const getDynamicName = (segment: string) => {
    // In a real app, you might fetch this data, but for now, we'll use mock data.
    const client = mockClients.find(c => c.id === segment);
    if (client) {
        return `Modifier: ${client.name}`;
    }
    return segment;
}


export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) return null;

  const isDashboardRoot = segments.length === 1 && (segments[0] === 'dashboard');
  const isRoleDashboard = segments.length === 2 && ['accountant', 'admin', 'my-documents', 'secretary'].includes(segments[1]);

  if (isDashboardRoot || isRoleDashboard) {
    return null;
  }

  return (
    <nav aria-label="fil d'ariane" className="mb-4">
      <ol className="flex items-center space-x-1.5 text-sm">
        <li>
          <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
            <span className="sr-only">Accueil</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/');
          const isLast = index === segments.length - 1;
          
          let name = breadcrumbNameMap[segment] || getDynamicName(segment);
          
          if (segment === 'dashboard' || segment === 'accountant' || segment === 'admin' || segment === 'secretary') return null;

          return (
            <Fragment key={href}>
              <li>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </li>
              <li>
                <Link
                  href={href}
                  className={cn(
                    'transition-colors',
                    isLast
                      ? 'text-foreground font-semibold pointer-events-none'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {name}
                </Link>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
