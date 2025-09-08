
'use client';

import { useState, useEffect } from "react";
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
import type { Client } from "@/lib/client-data";

type PopoverClient = {
  value: string;
  label: string;
}

export function ClientSwitcher() {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [clients, setClients] = useState<PopoverClient[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndSetClients = async () => {
        const clientsData = await getClients();
        const role = localStorage.getItem('userRole');
        setUserRole(role);

        if (role === 'client') {
            const userEmail = localStorage.getItem('userEmail');
            // In a real app, you'd have a more robust way of linking user to client.
            // Here, we find the client by their name, assuming it's in localStorage.
            const clientName = localStorage.getItem('userName');
            const client = clientsData.find(c => c.name === clientName || c.email === userEmail);
            if(client) {
                setClients([{ value: client.id, label: client.name }]);
                setSelectedValue(client.id);
                localStorage.setItem('selectedClientId', client.id);
            }
        } else {
            setClients(clientsData.map(c => ({ value: c.id, label: c.name })));
            const storedClientId = localStorage.getItem('selectedClientId');
            if (storedClientId && clientsData.some(c => c.id === storedClientId)) {
              setSelectedValue(storedClientId);
            }
        }
    };
    fetchAndSetClients();
    
    const handleStorageChange = () => {
          const storedClientId = localStorage.getItem('selectedClientId');
          if (storedClientId) {
              setSelectedValue(storedClientId);
          }
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
