import { z } from 'zod';

export const messageRequestSchema = z.object({
  id: z.string().nullable(),
  content: z.string(),
});

export type MessageRequest = z.infer<typeof messageRequestSchema>;

export const messageResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;
