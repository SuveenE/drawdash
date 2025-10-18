'use client';

import Image from 'next/image';

import { useState } from 'react';

import { Mic } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [activeTab, setActiveTab] = useState('agent');

  return (
    <>
      <style jsx>{`
        @keyframes scale-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }
        .animate-scale-pulse {
          animation: scale-pulse 2s ease-in-out infinite;
        }
      `}</style>
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

        {/* Tabs for Agent Mode and Ask Mode */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agent">Agent Mode</TabsTrigger>
            <TabsTrigger value="ask">Ask Mode</TabsTrigger>
          </TabsList>

          <TabsContent value="agent" className="mt-0 flex flex-col gap-6">
            {/* Agent Mode Description */}
            <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
              <button
                onClick={onToggleListening}
                className="flex-shrink-0 cursor-pointer transition-transform hover:scale-110"
              >
                {isListening ? (
                  <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-red-500 shadow-lg">
                    <Mic className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="animate-scale-pulse flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 shadow-md hover:bg-blue-600">
                    <Mic className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
              <p className="text-sm text-blue-900">
                Agent mode listens to your explanations and proactively suggests diagram changes.
              </p>
            </div>

            {/* Live Transcript Display */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-900">Live Transcript</label>
              <div className="min-h-[80px] w-full rounded-md p-3 text-sm text-gray-700">
                {transcript || (
                  <span className="text-gray-400">Click the microphone icon above to begin...</span>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-md border border-red-500 bg-red-50 p-3 text-sm text-red-900">
                {error}
              </div>
            )}

            {/* Status Indicator */}
            {isGenerating && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                Processing and updating diagram...
              </div>
            )}
          </TabsContent>

          <TabsContent value="ask" className="mt-0 flex flex-col gap-6">
            {/* Ask Mode Description */}
            <div className="rounded-md border border-purple-200 bg-purple-50 p-3">
              <p className="text-sm text-purple-900">
                Ask mode lets you type a prompt, then generate/edit the diagram manually.
              </p>
            </div>

            {/* Text Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-900">
                What do you want to change?
              </label>
              <Input
                type="text"
                placeholder="Type your prompt here..."
                value={transcript}
                onChange={(e) => onTranscriptChange(e.target.value)}
                className="w-full border-0 bg-white text-black shadow-none focus-visible:ring-0"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-md border border-red-500 bg-red-50 p-3 text-sm text-red-900">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={onGenerate}
              className="w-full"
              size="lg"
              disabled={isGenerating || !transcript.trim()}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Spacer */}
        <div className="flex-1" />
      </div>
    </>
  );
}
