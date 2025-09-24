
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { MessageSquare, Bot, Send, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { supportChat } from '@/ai/flows/support-chat-flow';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { Message } from 'genkit';


export function SupportChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [documentation, setDocumentation] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
             // Start with a predefined welcome message
            if (messages.length === 0) {
                setMessages([{ role: 'model', content: [{ text: "Bonjour ! Je suis ComptaBot, votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?" }] }]);
            }
            // Fetch documentation when chat opens
            if (documentation === null) {
                fetch('/DOCUMENTATION.html')
                    .then(response => response.text())
                    .then(text => setDocumentation(text))
                    .catch(error => {
                        console.error("Failed to fetch documentation:", error);
                        setDocumentation("Documentation not available.");
                    });
            }
        }
    }, [isOpen, messages.length, documentation]);

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || documentation === null) return;

        const userMessage: Message = { role: 'user', content: [{ text: input }] };
        const newMessages: Message[] = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // The history sent to the AI must not include the initial welcome message from the bot.
            const historyForAI = newMessages.slice(1);

            const response = await supportChat({
                history: historyForAI,
                documentation: documentation,
            });
            setMessages([...newMessages, { role: 'model', content: [{ text: response }] }]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = { role: 'model', content: [{ text: "Désolé, une erreur est survenue. Veuillez réessayer plus tard." }] };
            setMessages([...newMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted) {
        return null;
    }
    
    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="fixed bottom-0 right-0 z-[51] h-full w-full md:h-auto md:w-auto md:max-h-[calc(100vh-4rem)] md:max-w-sm md:bottom-20 md:right-4"
                    >
                        <Card className="h-full w-full flex flex-col shadow-2xl rounded-none md:rounded-lg">
                             <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 border-2 border-primary/50">
                                            <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                                        </Avatar>
                                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">ComptaBot</CardTitle>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500"></span> En ligne</p>
                                    </div>
                                </div>
                                 <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Fermer le chat</span>
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden">
                                <ScrollArea className="h-full" ref={scrollAreaRef}>
                                    <div className="p-4 space-y-4">
                                        {messages.map((msg, index) => (
                                            <div key={index} className={cn("flex items-end gap-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                                 {msg.role === 'model' && (
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={cn(
                                                    "max-w-[80%] rounded-lg px-3 py-2 text-sm prose dark:prose-invert prose-p:my-0",
                                                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                                )}>
                                                     <ReactMarkdown>{msg.content[0].text}</ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex items-end gap-2 justify-start">
                                                <Avatar className="h-8 w-8 shrink-0">
                                                    <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                                                </Avatar>
                                                 <div className="bg-muted rounded-lg px-3 py-2 flex items-center justify-center">
                                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                 </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                             <CardFooter className="p-4 border-t">
                                <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Posez votre question..."
                                        autoComplete="off"
                                        disabled={isLoading || documentation === null}
                                    />
                                    <Button type="submit" size="icon" disabled={isLoading || !input.trim() || documentation === null}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="fixed bottom-4 right-4 z-[51]"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <Button size="icon" className="rounded-full w-14 h-14 shadow-lg" onClick={() => setIsOpen(!isOpen)}>
                    <AnimatePresence>
                         {isOpen ? (
                            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="h-6 w-6" /></motion.div>
                         ) : (
                            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageSquare className="h-6 w-6" /></motion.div>
                         )}
                    </AnimatePresence>
                    <span className="sr-only">Ouvrir le chatbot</span>
                </Button>
            </motion.div>
        </>
    );
}
