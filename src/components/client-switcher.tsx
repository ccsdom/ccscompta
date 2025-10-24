
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
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import type { Client } from "@/lib/types";

type PopoverClient = {
  value: string;
  label: string;
}

export function ClientSwitcher() {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const storedClientId = localStorage.getItem('selectedClientId');
    setUserRole(role);
    setSelectedValue(storedClientId);
    setIsMounted(true);

    const handleStorageChange = () => {
       const newRole = localStorage.getItem('userRole');
       const newClientId = localStorage.getItem('selectedClientId');
       setUserRole(newRole);
       setSelectedValue(newClientId);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isStaff = useMemo(() => isMounted && userRole && ['admin', 'accountant', 'secretary'].includes(userRole), [isMounted, userRole]);

  const clientsQuery = useMemoFirebase(() => {
    // CRITICAL: Only create a query if the user is confirmed to be staff.
    if (isStaff) {
      return query(collection(db, 'clients'), where('role', '==', 'client'));
    }
    return null;
  }, [isStaff]);
  
  const { data: clientsData, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  
  const clients: PopoverClient[] = useMemo(() => (clientsData || []).map(c => ({ value: c.id, label: c.name })), [clientsData]);

  const handleClientChange = (value: string) => {
      setSelectedValue(value);
      localStorage.setItem('selectedClientId', value);
      window.dispatchEvent(new Event('storage'));
      setOpen(false);
  }

  const selectedClient = clients.find(c => c.value === selectedValue);

  // Do not render anything until the component is mounted and role is determined
  if (!isMounted) {
    return <Button variant="outline" className="w-full justify-between" disabled />;
  }
  
  // If the user is a client, disable the switcher completely.
  if (userRole === 'client') {
      const clientName = localStorage.getItem('userName');
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
                  value={client.label} // Use label for filtering
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
