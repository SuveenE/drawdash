'use client';

import Image from 'next/image';

import { useEffect, useRef, useState } from 'react';

import { Mic, MicOff } from 'lucide-react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + ' ';
            }
          }

          setTranscript((prev) => prev + finalTranscript);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError('Please provide a voice prompt first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Export the canvas as base64 image
      let canvasImageData: string | null = null;

      if (editorRef.current) {
        const editor = editorRef.current;
        const shapeIds = editor.getCurrentPageShapeIds();

        if (shapeIds.size > 0) {
          // Export the canvas to PNG using tldraw's toImage method
          const { blob } = await editor.toImage(Array.from(shapeIds), {
            format: 'png',
            background: false,
          });

          // Convert blob to base64
          await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              // Remove the data:image/png;base64, prefix
              canvasImageData = base64data.split(',')[1];
              resolve(null);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      }

      // Call the backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: transcript,
          image_data: canvasImageData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImage(data.image_data);

      if (data.text_response) {
        console.log('Model response:', data.text_response);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 flex">
      {/* Left Side - Drawing Canvas */}
      <div className="flex flex-1 flex-col">
        <div className="border-b p-2 text-center text-sm font-medium">Drawing Canvas</div>
        <div className="flex-1">
          <Tldraw
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>
      </div>

      {/* Right Sidebar - Generated Image & Controls */}
      <div className="bg-background flex w-96 flex-col gap-6 border-l p-6">
        {/* Generated Image Display */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Generated Image</label>
          <div className="bg-muted/30 relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border-2 border-dashed">
            {generatedImage ? (
              <Image
                src={`data:image/png;base64,${generatedImage}`}
                alt="Generated"
                fill
                className="object-contain"
              />
            ) : (
              <span className="text-muted-foreground text-sm">No image generated yet</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Text Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Prompt (Text)</label>
          <Input
            type="text"
            placeholder="Type your prompt here or use voice input below..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Microphone Control */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Voice Input</label>
          <Button
            onClick={toggleListening}
            variant={isListening ? 'destructive' : 'default'}
            className="w-full"
          >
            {isListening ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Listening
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-md border border-red-500 bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          className="w-full"
          disabled={isGenerating || !transcript.trim()}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>

        {/* Spacer */}
        <div className="flex-1" />
      </div>
    </div>
  );
}
