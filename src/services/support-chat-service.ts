'use client';

import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';

export type SupportChatMessage = {
  role: 'user' | 'model';
  text: string;
};

type SupportChatInput = {
  history: SupportChatMessage[];
  clientId?: string;
};

type SupportChatOutput = {
  response: string;
};

export async function supportChat(input: SupportChatInput): Promise<string> {
  const callable = httpsCallable<SupportChatInput, SupportChatOutput>(functions, 'supportChat');
  const result = await callable(input);
  return result.data.response;
}
