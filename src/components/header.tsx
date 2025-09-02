import { FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center px-4 md:px-6">
        <div className="mr-4 flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">PaperTrail</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
           <Avatar>
            <AvatarImage src="https://picsum.photos/100" data-ai-hint="person face" alt="Utilisateur" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
