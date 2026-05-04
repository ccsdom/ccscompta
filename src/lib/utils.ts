import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Formats a date safely, handling strings, numbers, and Firestore Timestamps.
 */
export function formatDate(date: any, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }): string {
  if (!date) return 'N/A';
  
  let d: Date;
  
  if (date.seconds !== undefined) {
    // Firestore Timestamp
    d = new Date(date.seconds * 1000);
  } else if (date instanceof Date) {
    d = date;
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return 'Date invalide';
  
  return d.toLocaleDateString('fr-FR', options);
}

/**
 * Parses a date safely from strings, numbers, or Firestore Timestamps.
 */
export function parseDate(date: any): Date | null {
  if (!date) return null;
  
  let d: Date;
  
  if (date.seconds !== undefined) {
    d = new Date(date.seconds * 1000);
  } else if (date instanceof Date) {
    d = date;
  } else {
    d = new Date(date);
  }

  return isNaN(d.getTime()) ? null : d;
}

