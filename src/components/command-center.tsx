
'use client';

import * as React from 'react';
import {
  Search,
  Settings,
  ScanLine,
  Landmark,
  MessageSquare,
  Moon,
  Sun,
  PlusCircle,
  LayoutDashboard,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useBranding } from '@/components/branding-provider';

export function CommandCenter() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { role } = useBranding();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const adminActions = [
    { icon: LayoutDashboard, label: 'Tableau de bord Mission Control', shortcut: 'D', action: () => router.push('/dashboard/admin') },
    { icon: Landmark, label: 'Gestion des Cabinets', shortcut: 'C', action: () => router.push('/dashboard/cabinets') },
    { icon: Settings, label: 'Paramètres Globaux SaaS', shortcut: 'S', action: () => router.push('/dashboard/settings') },
    { icon: RefreshCw, label: 'Synchronisation des Rôles Admin', shortcut: 'R', action: () => window.location.reload() },
  ];

  const clientActions = [
    { icon: PlusCircle, label: 'Déposer un document', shortcut: 'U', action: () => router.push('/dashboard/my-documents') },
    { icon: ScanLine, label: 'Scanner un justificatif', shortcut: 'S', action: () => router.push('/dashboard/scan') },
    { icon: Landmark, label: 'Ma Banque & Rapprochement', shortcut: 'B', action: () => router.push('/dashboard/my-bank') },
    { icon: MessageSquare, label: 'Contacter mon comptable', shortcut: 'M', action: () => router.push('/support') },
    { icon: Settings, label: 'Paramètres du compte', shortcut: ',', action: () => router.push('/dashboard/settings') },
  ];

  const themeAction = { 
    icon: theme === 'dark' ? Sun : Moon, 
    label: `Passer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`, 
    shortcut: 'T', 
    action: () => setTheme(theme === 'dark' ? 'light' : 'dark') 
  };

  const actions = React.useMemo(() => {
    let base = role === 'admin' ? adminActions : clientActions;
    return [...base, themeAction];
  }, [role, theme]);

  const filteredActions = actions.filter(a => a.label.toLowerCase().includes(search.toLowerCase()));

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm px-4" onClick={() => setOpen(false)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-background/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden glass-panel"
        >
          <div className="relative flex items-center p-6 border-b border-white/5">
            <Search className="h-6 w-6 text-primary mr-4" />
            <input
              autoFocus
              placeholder="Que voulez-vous faire ?"
              className="flex-1 bg-transparent border-none outline-none text-xl font-medium placeholder:text-muted-foreground/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest opacity-50">
              <span>ESC</span>
            </div>
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto">
             <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-primary/60">Actions Rapides</div>
             <div className="space-y-1">
                {filteredActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => { action.action(); setOpen(false); }}
                    className="w-full group flex items-center justify-between p-4 rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <action.icon className="h-5 w-5" />
                      </div>
                      <span className="font-bold">{action.label}</span>
                    </div>
                    {action.shortcut && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold group-hover:bg-white/20">
                         {action.shortcut}
                      </div>
                    )}
                  </button>
                ))}
                {filteredActions.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground opacity-40">
                    Aucun résultat pour "{search}"
                  </div>
                )}
             </div>
          </div>

          <div className="p-4 bg-muted/20 border-t border-white/5 flex items-center justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            <div className="flex gap-4">
               <span>↑↓ Naviguer</span>
               <span>↵ Sélectionner</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">⌘</div>
                <span>+ K</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
