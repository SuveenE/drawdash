'use client';

import { useEffect, useRef, useState } from 'react';

import { Mic, MicOff } from 'lucide-react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

import { Button } from '@/components/ui/button';

export default function Home() {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

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

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + ' ';
            } else {
              interimTranscript += transcriptPiece;
            }
          }

          setTranscript((prev) => prev + finalTranscript);
        };

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
    setIsGenerating(true);
    console.log('Generating with transcript:', transcript);
    // TODO: Implement generation logic
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
      // For now, just set a placeholder
      setGeneratedImage('generated');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 flex">
      {/* Left Side - Drawing Canvas */}
      <div className="flex flex-1 flex-col">
        <div className="border-b p-2 text-center text-sm font-medium">Drawing Canvas</div>
        <div className="flex-1">
          <Tldraw />
        </div>
      </div>

      {/* Right Sidebar - Generated Image & Controls */}
      <div className="bg-background flex w-96 flex-col gap-6 border-l p-6">
        {/* Generated Image Display */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Generated Image</label>
          <div className="bg-muted/30 flex aspect-square w-full items-center justify-center rounded-md border-2 border-dashed">
            {generatedImage ? (
              <div className="text-sm">Generated image preview</div>
            ) : (
              <span className="text-muted-foreground text-sm">No image generated yet</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" />

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

        {/* Transcript Display */}
        {transcript && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Transcript</label>
            <div className="bg-muted/30 min-h-24 w-full rounded-md border p-3 text-sm">
              {transcript}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button onClick={handleGenerate} className="w-full" disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>

        {/* Spacer */}
        <div className="flex-1" />
      </div>
    </div>
  );
}
