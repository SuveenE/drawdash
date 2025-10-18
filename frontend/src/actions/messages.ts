'use server';

import axios from 'axios';

import { MessageRequest, MessageResponse, messageResponseSchema } from '@/types/messages';

export async function chat(request: MessageRequest): Promise<MessageResponse> {
  try {
    console.log('Sending message:', request);
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/messages`,
      request,
    );
    return messageResponseSchema.parse(response.data);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
