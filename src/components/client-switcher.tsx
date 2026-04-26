
'use client';

import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, Building } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { Client, UserProfile } from "@/lib/types";

type PopoverClient = {
  value: string;
  label: string;
}

export function ClientSwitcher() {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { user } = useUser();
  const userProfileQuery = useMemo(() => user ? doc(db, 'clients', user.uid) : null, [user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileQuery);

  useEffect(() => {
    // This effect runs on the client to safely access localStorage
    const storedClientId = localStorage.getItem('selectedClientId');
    setSelectedValue(storedClientId);
    setIsMounted(true);

    const handleStorageChange = () => {
       const newClientId = localStorage.getItem('selectedClientId');
       setSelectedValue(newClientId);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const userRole = userProfile?.role || 'client';
  const isStaff = isMounted && userRole && ['admin', 'accountant', 'secretary'].includes(userRole);
  const isAdmin = userRole === 'admin';

  const clientsQuery = useMemoFirebase(() => {
    if (!isStaff || !userProfile) return null;

    if (isAdmin) {
      // SaaS Admin sees all clients
      return query(collection(db, 'clients'), where('role', '==', 'client'));
    }

    if (userProfile.cabinetId) {
      // Staff (Accountant/Secretary) only see clients from their cabinet
      return query(
        collection(db, 'clients'), 
        where('role', '==', 'client'),
        where('cabinetId', '==', userProfile.cabinetId)
      );
    }

    return null;
  }, [isStaff, isAdmin, userProfile?.cabinetId]);
  
  const { data: clientsData, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  
  const clients: PopoverClient[] = useMemo(() => (clientsData || []).map(c => ({ value: c.id, label: c.name })), [clientsData]);

  const handleClientChange = (value: string) => {
      setSelectedValue(value);
      localStorage.setItem('selectedClientId', value);
      window.dispatchEvent(new Event('storage'));
      setOpen(false);
  }

  const selectedClient = clients.find(c => c.value === selectedValue);

  if (!isMounted) {
    return <Button variant="outline" className="w-full justify-between" disabled />;
  }
  
  if (userRole === 'client') {
      const clientName = userProfile?.name || localStorage.getItem('userName');
      return (
        <Button variant="outline" role="combobox" className="w-full justify-between" disabled>
            <div className="flex items-center gap-2 overflow-hidden">
                <Avatar className="h-6 w-6">
                    <AvatarFallback>
                        {clientName ? clientName.charAt(0) : <Building className="h-4 w-4"/>}
                    </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm truncate">
                    {clientName || "Mon Espace"}
                </span>
            </div>
        </Button>
      );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoadingClients || !isStaff}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Avatar className="h-6 w-6">
                <AvatarFallback>
                    {selectedClient ? selectedClient.label.charAt(0) : <Building className="h-4 w-4"/>}
                </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm truncate">
                {selectedClient ? selectedClient.label : "Sélectionner un client..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un client..." />
          <CommandList>
            <CommandEmpty>Aucun client trouvé.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.value}
                  value={client.label}
                  onSelect={() => handleClientChange(client.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValue === client.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {client.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
