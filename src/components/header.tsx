import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-full items-center px-4 md:px-6">
        
        <div className="flex flex-1 items-center justify-end space-x-4">
            <ThemeToggle />
           <Avatar>
            <AvatarImage src="https://picsum.photos/100" data-ai-hint="person face" alt="Utilisateur" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
