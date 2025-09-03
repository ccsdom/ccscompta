
'use server';
/**
 * @fileOverview An AI agent that acts as a support chatbot.
 *
 * - supportChat - A function that handles the conversational chat.
 * - SupportChatInput - The input type for the supportChat function.
 * - SupportChatOutput - The return type for the supportChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {Message, Role} from 'genkit';
import * as fs from 'fs/promises';
import * as path from 'path';

// Define the schema for the conversation history
const SupportHistorySchema = z.array(z.object({
  role: z.nativeEnum(Role),
  content: z.array(z.object({ text: z.string() })),
}));
export type SupportHistory = z.infer<typeof SupportHistorySchema>;

// Define the input schema for the chat flow
const SupportChatInputSchema = z.object({
  question: z.string().describe('The user\'s question.'),
  history: SupportHistorySchema.optional().describe('The conversation history.'),
});
export type SupportChatInput = z.infer<typeof SupportChatInputSchema>;

// Define the output schema for the chat flow
const SupportChatOutputSchema = z.string().describe('The AI\'s response.');
export type SupportChatOutput = z.infer<typeof SupportChatOutputSchema>;


let documentationContent: string | null = null;
async function getDocumentation(): Promise<string> {
    if (documentationContent === null) {
        try {
            const docPath = path.join(process.cwd(), 'public', 'DOCUMENTATION.html');
            documentationContent = await fs.readFile(docPath, 'utf-8');
        } catch (error) {
            console.error("Error reading documentation file:", error);
            documentationContent = "Documentation not available.";
        }
    }
    return documentationContent;
}

// Export a wrapper function to be called from the client
export async function supportChat(input: SupportChatInput): Promise<SupportChatOutput> {
  return supportChatFlow(input);
}


const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: SupportChatInputSchema,
    outputSchema: SupportChatOutputSchema,
  },
  async (input) => {
    const documentation = await getDocumentation();
    
    const messages: Message[] = [];

    // Add a system message to set the context for the entire conversation
    messages.push({
      role: 'system',
      content: [{ text: `You are an expert support agent for the "CCS Compta" software. Your name is 'ComptaBot'.
Your ONLY source of information is the official documentation provided.
You MUST NOT answer any questions that are not covered in the documentation. If the answer is not in the documentation, you must politely say "Je suis désolé, mais je ne trouve pas d'information à ce sujet dans ma documentation. Pouvez-vous reformuler votre question ou contacter le support technique ?".
You must be friendly, professional, and speak in French.
Start by introducing yourself as "ComptaBot, votre assistant virtuel." if this is the first message from the user.
When you answer, be concise and clear. Format your answers with markdown for better readability (e.g., use lists, bold text).
Never mention that you are an AI or that you are working from a document. Just provide the answer directly.

Official Documentation:
${documentation}`
      }]
    });
    
    // Add existing conversation history
    if (input.history && input.history.length > 0) {
        messages.push(...input.history);
    }
    
    // Add the new user question
    messages.push({ role: 'user', content: [{ text: input.question }] });


    const { text } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        messages: messages,
        config: {
            temperature: 0.2, // Lower temperature for more factual, less creative answers
        },
    });

    return text;
  }
);
