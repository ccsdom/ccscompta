
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
import {Message} from 'genkit';

// Define the input schema for the chat flow
const SupportChatInputSchema = z.object({
  history: z.array(Message).describe("The conversation history."),
  documentation: z.string().describe('The content of the documentation file.'),
});
export type SupportChatInput = z.infer<typeof SupportChatInputSchema>;

// Define the output schema for the chat flow
const SupportChatOutputSchema = z.string().describe('The AI\'s response.');
export type SupportChatOutput = z.infer<typeof SupportChatOutputSchema>;


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
    
    const systemMessage: Message = {
      role: 'system',
      content: [{ text: `You are an expert support agent for the "CCS Compta" software. Your name is 'ComptaBot'.
Your ONLY source of information is the official documentation provided.
You MUST NOT answer any questions that are not covered in the documentation. If the answer is not in the documentation, you must politely say "Je suis désolé, mais je ne trouve pas d'information à ce sujet dans ma documentation. Pouvez-vous reformuler votre question ou contacter le support technique ?".
You must be friendly, professional, and speak in French.
When you answer, be concise and clear. Format your answers with markdown for better readability (e.g., use lists, bold text).
Never mention that you are an AI or that you are working from a document. Just provide the answer directly.

Official Documentation:
${input.documentation}`
      }]
    };
    
    const messages: Message[] = [systemMessage, ...input.history];

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
