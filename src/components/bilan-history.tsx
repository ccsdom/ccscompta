
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Download, FileWarning, CheckCircle, Clock } from 'lucide-react';
import type { Bilan } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

interface BilanHistoryProps {
  clientId: string;
}

const getStatusBadge = (status: Bilan['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    case 'reviewing':
      return <Badge variant="secondary"><FileWarning className="h-3 w-3 mr-1" />En revue</Badge>;
    case 'completed':
      return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100/80"><CheckCircle className="h-3 w-3 mr-1" />Complété</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function BilanHistory({ clientId }: BilanHistoryProps) {
  const bilansQuery = useMemoFirebase(() => {
    if (!clientId) return null;
    return query(collection(db, 'bilans'), where('clientId', '==', clientId));
  }, [clientId]);
  const { data: bilans, isLoading } = useCollection<Bilan>(bilansQuery);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Bilans</CardTitle>
        <CardDescription>Consultez les bilans annuels de ce client.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Année de l'exercice</TableHead>
              <TableHead>Chiffre d'affaires</TableHead>
              <TableHead>Résultat Net</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                ))
            ) : bilans && bilans.length > 0 ? (
              bilans.map((bilan) => (
                <TableRow key={bilan.id}>
                  <TableCell className="font-medium">{bilan.year}</TableCell>
                  <TableCell>{bilan.turnover.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</TableCell>
                  <TableCell className={bilan.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {bilan.netIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </TableCell>
                  <TableCell>{getStatusBadge(bilan.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" disabled={bilan.status !== 'completed'}>
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Télécharger</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Aucun bilan trouvé pour ce client.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    