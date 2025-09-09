
'use client';

import { useState, useCallback, Fragment } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { searchCompany, type CompanySearchResult } from '@/ai/flows/search-company-flow';
import debounce from 'lodash.debounce';
import { ChevronsUpDown, Loader2, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CompanySearchComboboxProps {
    onCompanySelect: (company: CompanySearchResult | null) => void;
}

export function CompanySearchCombobox({ onCompanySelect }: CompanySearchComboboxProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<CompanySearchResult[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchCompanies = async (query: string) => {
        if (query.length < 3) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        try {
            const data = await searchCompany({ query });
            setResults(data.results || []);
        } catch (error) {
            console.error("Failed to search companies", error);
            toast({
                title: "Erreur de recherche",
                description: "Impossible de récupérer les informations des entreprises.",
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetch = useCallback(debounce(fetchCompanies, 300), []);

    const handleInputChange = (value: string) => {
        setSearchTerm(value);
        debouncedFetch(value);
    }

    const handleSelect = (company: CompanySearchResult) => {
        setSelectedCompany(company);
        onCompanySelect(company);
        setSearchTerm(company.name);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <span className={cn("truncate", !selectedCompany && "text-muted-foreground")}>
                        {selectedCompany ? selectedCompany.name : "Rechercher une entreprise par nom ou SIRET..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command shouldFilter={false}>
                    <CommandInput 
                        placeholder="Taper le nom ou le SIRET..."
                        onValueChange={handleInputChange}
                        value={searchTerm}
                    />
                    <CommandList>
                        {isLoading && <CommandEmpty><Loader2 className="h-4 w-4 animate-spin mx-auto my-4" /></CommandEmpty>}
                        {!isLoading && results.length === 0 && searchTerm.length > 2 && (
                            <CommandEmpty>Aucune entreprise trouvée.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {results.map((company) => (
                                <CommandItem
                                    key={company.siret}
                                    value={company.siret}
                                    onSelect={() => handleSelect(company)}
                                    className="flex items-start gap-3"
                                >
                                    <div className="p-2 bg-muted rounded-md mt-1">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{company.name}</p>
                                        <p className="text-xs text-muted-foreground">{company.address}</p>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
