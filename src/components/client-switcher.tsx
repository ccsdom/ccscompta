
'use client';

import { useState, useEffect, useCallback } from "react";
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
import { getClients } from "@/ai/flows/client-actions";
import type { Client } from "@/lib/types";

type PopoverClient = {
  value: string;
  label: string;
}

export function ClientSwitcher() {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [clients, setClients] = useState<PopoverClient[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchAndSetClients = useCallback(async () => {
      try {
          const clientsData = await getClients();
          const role = localStorage.getItem('userRole');
          setUserRole(role);

          if (role === 'client') {
              const userEmail = localStorage.getItem('userEmail');
              const client = clientsData.find(c => c.email.toLowerCase() === userEmail?.toLowerCase());
              if (client) {
                  setClients([{ value: client.id, label: client.name }]);
                  setSelectedValue(client.id);
                  if (localStorage.getItem('selectedClientId') !== client.id) {
                    localStorage.setItem('selectedClientId', client.id);
                    window.dispatchEvent(new Event('storage'));
                  }
              }
          } else {
              setClients(clientsData.map(c => ({ value: c.id, label: c.name })));
              const storedClientId = localStorage.getItem('selectedClientId');
              if (storedClientId && clientsData.some(c => c.id === storedClientId)) {
                setSelectedValue(storedClientId);
              } else {
                setSelectedValue(null);
              }
          }
      } catch (error) {
        console.error("Failed to fetch clients for switcher:", error);
      }
  }, []);


  useEffect(() => {
    fetchAndSetClients();
    
    // This listener handles updates from other components
    const handleStorageChange = () => {
       fetchAndSetClients();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [fetchAndSetClients]);

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
