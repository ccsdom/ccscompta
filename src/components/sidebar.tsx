'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Settings, LogOut, FileText, ChevronDown, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';


const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/dashboard/documents', icon: FileText, label: 'Mes documents' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analyse' },
  { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
];

const mockClients = [
    { id: 'alpha', name: 'Entreprise Alpha'},
    { id: 'beta', name: 'Bêta SARL'},
    { id: 'gamma', name: 'Gamma Inc.'},
]

export function Sidebar() {
  const pathname = usePathname();
  const [selectedClient, setSelectedClient] = useState(mockClients[0]);

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col">
      <div className="flex items-center justify-center h-16 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">CCS Compta</span>
        </Link>
      </div>

        <div className="p-4">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="outline" className="w-full justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback>{selectedClient.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm truncate">{selectedClient.name}</span>
                        </div>
                       <ChevronDown className="h-4 w-4 text-muted-foreground" />
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Changer de client</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {mockClients.map(client => (
                         <DropdownMenuItem key={client.id} onClick={() => setSelectedClient(client)}>
                            <Building className="mr-2 h-4 w-4" />
                            <span>{client.name}</span>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        Gérer les clients
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
              (pathname === item.href) && 'bg-muted text-primary'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t">
        <Link href="/login">
            <Button variant="ghost" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
            </Button>
        </Link>
      </div>
    </aside>
  );
}
