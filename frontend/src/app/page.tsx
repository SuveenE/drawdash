'use client';

import { useState } from 'react';

import { chat } from '@/actions/messages';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { messageRequestSchema } from '@/types/messages';

export default function Home() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Chat with your data</h1>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter a message"
        className="w-full"
        autoFocus
      />
      <Button
        onClick={async () => {
          const messageRequest = messageRequestSchema.parse({
            id: null,
            content: message,
          });
          const response = await chat(messageRequest);
          setResponse(response.content);
        }}
      >
        Send
      </Button>
      <p>{response}</p>
    </div>
  );
}
