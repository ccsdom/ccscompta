'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useUser, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { Client, Cabinet, Role } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface BrandingContextType {
    cabinet: Cabinet | null;
    profile: Client | null;
    role: Role | null;
    isLoading: boolean;
    isImpersonating: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
    cabinet: null,
    profile: null,
    role: null,
    isLoading: true,
    isImpersonating: false,
});

export const useBranding = () => useContext(BrandingContext);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    
    // Check for impersonation from localStorage (still used as bridge for now)
    const [impersonatedId, setImpersonatedId] = useState<string | null>(null);
    const [impersonatedRole, setImpersonatedRole] = useState<Role | null>(null);

    useEffect(() => {
        const checkImpersonation = () => {
            const sid = localStorage.getItem('selectedClientId');
            const srole = localStorage.getItem('userRole') as Role;
            setImpersonatedId(sid);
            setImpersonatedRole(srole);
        };
        
        checkImpersonation();
        window.addEventListener('storage', checkImpersonation);
        return () => window.removeEventListener('storage', checkImpersonation);
    }, []);

    // 1. Fetch Effective Profile
    // SECURITY: Only allow impersonation if the real user has an admin/staff role in their profile
    // This avoids permission errors when the custom claims are not yet synchronized.
    const [isActuallyStaff, setIsActuallyStaff] = useState(false);
    
    // First, fetch the REAL user profile to check their authorization level
    const realProfileRef = useMemo(() => user?.uid ? doc(db, 'clients', user.uid) : null, [user?.uid]);
    const { data: realProfile } = useDoc<Client>(realProfileRef);

    useEffect(() => {
        if (realProfile?.role && ['admin', 'accountant', 'secretary'].includes(realProfile.role)) {
            setIsActuallyStaff(true);
        } else {
            setIsActuallyStaff(false);
        }
    }, [realProfile]);

    const effectiveUid = (isActuallyStaff && impersonatedId) ? impersonatedId : user?.uid;
    const profileRef = useMemo(() => effectiveUid ? doc(db, 'clients', effectiveUid) : null, [effectiveUid]);
    const { data: profile, isLoading: isProfileLoading, error: profileError } = useDoc<Client>(profileRef);

    // Auto-reset if impersonation fails
    useEffect(() => {
        if (profileError && impersonatedId) {
            console.warn("Impersonation failed: insufficient permissions. Resetting to real profile.");
            localStorage.removeItem('selectedClientId');
            localStorage.removeItem('userRole');
            setImpersonatedId(null);
            setImpersonatedRole(null);
            window.dispatchEvent(new Event('storage'));
        }
    }, [profileError, impersonatedId]);

    // 2. Fetch Cabinet
    const cabinetRef = useMemo(() => profile?.cabinetId ? doc(db, 'cabinets', profile.cabinetId) : null, [profile?.cabinetId]);
    const { data: cabinet, isLoading: isCabinetLoading } = useDoc<Cabinet>(cabinetRef);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 3. Inject CSS Variables
    useEffect(() => {
        if (!cabinet?.primaryColor) {
            document.documentElement.style.removeProperty('--primary');
            document.documentElement.style.removeProperty('--primary-foreground');
            return;
        }

        const root = document.documentElement;
        const color = cabinet.primaryColor;
        
        const isLight = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 155;
        };

        root.style.setProperty('--primary', color);
        root.style.setProperty('--primary-foreground', isLight(color) ? '0 0% 0%' : '0 0% 100%');
        root.style.setProperty('--selection-bg', `${color}33`);

    }, [cabinet?.primaryColor]);

    const value = useMemo(() => ({
        cabinet: cabinet || null,
        profile: profile || null,
        role: impersonatedRole || profile?.role || null,
        isLoading: isUserLoading || isProfileLoading || isCabinetLoading,
        isImpersonating: !!impersonatedId,
    }), [cabinet, profile, impersonatedRole, isUserLoading, isProfileLoading, isCabinetLoading, impersonatedId]);

    // Initial loading screen to prevent layout shifts
    if (!mounted || (isUserLoading && !user)) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background z-[100]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium animate-pulse">Initialisation de l'espace...</p>
                </div>
            </div>
        );
    }

    return (
        <BrandingContext.Provider value={value}>
            {children}
        </BrandingContext.Provider>
    );
}
