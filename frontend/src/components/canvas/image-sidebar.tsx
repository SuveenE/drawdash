'use client';

import Image from 'next/image';

import { Mic, MicOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImageSidebarProps {
  generatedImage: string | null;
  imageUsed: boolean;
  transcript: string;
  isListening: boolean;
  isGenerating: boolean;
  error: string | null;
  onTranscriptChange: (value: string) => void;
  onToggleListening: () => void;
  onGenerate: () => void;
  onAcceptImage: () => void;
  onRejectImage: () => void;
  canvasReady: boolean;
}

export function ImageSidebar({
  generatedImage,
  imageUsed,
  transcript,
  isListening,
  isGenerating,
  error,
  onTranscriptChange,
  onToggleListening,
  onGenerate,
  onAcceptImage,
  onRejectImage,
  canvasReady,
}: ImageSidebarProps) {
  return (
    <div className="flex w-96 flex-col gap-6 border-l border-gray-200 bg-white p-6">
      {/* Generated Image Display */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-900">Generated Image</label>
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50">
          {generatedImage ? (
            <Image
              src={`data:image/png;base64,${generatedImage}`}
              alt="Generated"
              fill
              className="object-contain"
            />
          ) : (
            // <Image src="/test.png" alt="Test preview" fill className="object-contain" />
            <span className="text-sm text-gray-500">No image generated yet</span>
          )}
        </div>
        {!imageUsed && generatedImage && (
          <div className="flex gap-4">
            <Button
              onClick={onAcceptImage}
              variant="outline"
              className="flex-1 border-2 border-green-600 bg-green-50 text-green-700 shadow-sm hover:bg-green-100 hover:text-green-800"
              disabled={!canvasReady}
            >
              Accept (Tab)
            </Button>
            <Button
              onClick={onRejectImage}
              variant="outline"
              className="flex-1 border-2 border-red-600 bg-red-50 text-red-700 shadow-sm hover:bg-red-100 hover:text-red-800"
              disabled={!canvasReady}
            >
              Reject (Esc)
            </Button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Text Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-900">Prompt (Text)</label>
        <Input
          type="text"
          placeholder="Type your prompt here or use voice input below..."
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          className="w-full bg-white text-black"
        />
      </div>

      {/* Microphone Control */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-900">Voice Input</label>
        <Button
          onClick={onToggleListening}
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
        <div className="rounded-md border border-red-500 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <Button onClick={onGenerate} className="w-full" disabled={isGenerating || !transcript.trim()}>
        {isGenerating ? 'Generating...' : 'Generate'}
      </Button>

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}
