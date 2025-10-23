
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

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  const clientsQuery = useMemoFirebase(() => {
    // Only fetch the list of clients if the user is a staff member.
    // A 'client' role should not have permission to list all other clients.
    if (userRole && ['admin', 'accountant', 'secretary'].includes(userRole)) {
      return query(collection(db, 'clients'), where('role', '==', 'client'));
    }
    return null; // For 'client' role, return null to prevent the query
  }, [userRole]);
  
  const { data: clientsData } = useCollection<Client>(clientsQuery);
  
  const clients: PopoverClient[] = useMemo(() => (clientsData || []).map(c => ({ value: c.id, label: c.name })), [clientsData]);

  useEffect(() => {
    const storedClientId = localStorage.getItem('selectedClientId');
    if (storedClientId && (clients.length === 0 || clients.some(c => c.value === storedClientId))) {
      setSelectedValue(storedClientId);
    } else if (clients.length > 0 && !storedClientId) {
      setSelectedValue(null);
    } else {
       setSelectedValue(null);
    }
  }, [clientsData, clients]);


  useEffect(() => {
    // This listener handles updates from other components
    const handleStorageChange = () => {
       const role = localStorage.getItem('userRole');
       setUserRole(role);
       const storedClientId = localStorage.getItem('selectedClientId');
       setSelectedValue(storedClientId);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  const handleClientChange = (value: string) => {
      setSelectedValue(value);
      localStorage.setItem('selectedClientId', value);
      window.dispatchEvent(new Event('storage'));
      setOpen(false);
  }

  const selectedClient = clients.find(c => c.value === selectedValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={userRole === 'client'}
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
      <PopoverContent className="w-[224px] p-0">
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
