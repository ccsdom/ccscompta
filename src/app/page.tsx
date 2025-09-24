'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/logo';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2500); // The splash screen will be visible for 2.5 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex flex-col items-center justify-center gap-4"
      >
        <Logo className="h-16 w-16 text-primary" />
        <div className="text-2xl font-bold tracking-wider text-foreground">
          CCS Compta
        </div>
      </motion.div>
      <div className="absolute bottom-16 flex items-center justify-center space-x-2">
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{
            scale: [1, 1.2, 1, 1, 1],
            opacity: [0.5, 1, 0.5, 0.5, 0.5],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{
            scale: [1, 1, 1.2, 1, 1],
            opacity: [0.5, 0.5, 1, 0.5, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.2,
          }}
        />
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{
            scale: [1, 1, 1, 1.2, 1],
            opacity: [0.5, 0.5, 0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.4,
          }}
        />
      </div>
    </main>
  );
}
