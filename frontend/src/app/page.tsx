'use client';

import Image from 'next/image';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Mic, MicOff } from 'lucide-react';
import { Tldraw, createShapeId } from 'tldraw';
import 'tldraw/tldraw.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Extend Window interface for Speech Recognition API
interface WindowWithSpeechRecognition extends Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SpeechRecognition?: new () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webkitSpeechRecognition?: new () => any;
}

export default function Home() {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [frameId, setFrameId] = useState<string | null>(null);
  const [imageUsed, setImageUsed] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    if (typeof window !== 'undefined') {
      const windowWithSpeech = window as unknown as WindowWithSpeechRecognition;
      const SpeechRecognition =
        windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

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

  // Load test image on mount for testing
  useEffect(() => {
    const loadTestImage = async () => {
      try {
        const response = await fetch('/test.png');
        const blob = await response.blob();

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove the data:image/png;base64, prefix
          const base64Image = base64data.split(',')[1];
          setGeneratedImage(base64Image);
          setImageUsed(false); // Show button when test image loads
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Error loading test image:', err);
      }
    };

    loadTestImage();
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

  const handleAcceptImage = useCallback(async () => {
    if (!editorRef.current || !frameId) {
      setError('Canvas not ready');
      return;
    }

    try {
      const editor = editorRef.current;
      const frame = editor.getShape(frameId);

      if (!frame) {
        setError('Frame not found');
        return;
      }

      // For testing, use test.png from public folder
      const response = await fetch('/test.png');
      const blob = await response.blob();

      // Convert blob to data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Get image dimensions
      const img = document.createElement('img');
      const imageLoadPromise = new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
      });
      img.src = dataUrl;
      const { width: imageWidth, height: imageHeight } = await imageLoadPromise;

      // Create asset ID with the required "asset:" prefix
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assetId = `asset:${createShapeId()}` as any;

      // Create the asset
      editor.createAssets([
        {
          id: assetId,
          type: 'image',
          typeName: 'asset',
          props: {
            name: 'test.png',
            src: dataUrl,
            w: imageWidth,
            h: imageHeight,
            mimeType: 'image/png',
            isAnimated: false,
          },
          meta: {},
        },
      ]);

      // Get frame dimensions
      const frameProps = frame.props as { w: number; h: number };

      // Calculate scaled dimensions to fit in frame
      const maxWidth = frameProps.w * 0.8;
      const maxHeight = frameProps.h * 0.8;
      const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);
      const scaledWidth = imageWidth * scale;
      const scaledHeight = imageHeight * scale;

      // Calculate position to center the image within the frame
      // Since we're using parentId, coordinates are relative to the frame's origin (0,0)
      const imageX = (frameProps.w - scaledWidth) / 2;
      const imageY = (frameProps.h - scaledHeight) / 2;

      // Create the image shape
      const imageShapeId = createShapeId();
      editor.createShapes([
        {
          id: imageShapeId,
          type: 'image',
          x: imageX,
          y: imageY,
          parentId: frameId,
          props: {
            w: scaledWidth,
            h: scaledHeight,
            assetId: assetId,
          },
        },
      ]);

      setImageUsed(true);
      console.log('Image placed in frame');
    } catch (err) {
      console.error('Error placing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to place image');
    }
  }, [frameId]);

  const handleRejectImage = useCallback(() => {
    setImageUsed(true);
    console.log('Image rejected');
  }, []);

  // Keyboard shortcuts for Accept/Reject
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if buttons are visible
      if (imageUsed || !generatedImage) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        handleAcceptImage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleRejectImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageUsed, generatedImage, handleAcceptImage, handleRejectImage]);

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

      if (editorRef.current && frameId) {
        const editor = editorRef.current;
        const frame = editor.getShape(frameId);

        if (frame) {
          // Get all shapes that are children of the frame
          const childShapeIds = editor.getSortedChildIdsForParent(frameId).filter((id: string) => {
            const shape = editor.getShape(id);
            return shape && !shape.isLocked;
          });

          // Include the frame itself and all its children for export
          const shapeIdsToExport = [frameId, ...childShapeIds];

          if (shapeIdsToExport.length > 0) {
            // Export only the frame and its contents to PNG
            const { blob } = await editor.toImage(shapeIdsToExport, {
              format: 'png',
              background: true,
              padding: 0,
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
      setImageUsed(false); // Reset when new image is generated

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
    <div className="fixed inset-0 flex bg-white">
      {/* Left Side - Drawing Canvas */}
      <div className="flex flex-1 flex-col bg-white">
        <div className="border-b border-gray-200 bg-white p-2 text-center text-sm font-medium text-gray-900">
          Drawing Canvas
        </div>
        <div className="flex-1">
          <Tldraw
            components={{
              StylePanel: null,
            }}
            onMount={(editor) => {
              editorRef.current = editor;

              // Check if a frame already exists (to prevent duplicates in React Strict Mode)
              const existingShapes = Array.from(editor.getCurrentPageShapeIds());
              const existingFrame = existingShapes.find((id) => {
                const shape = editor.getShape(id);
                return (
                  shape?.type === 'frame' &&
                  (shape.props as { name?: string })?.name === 'Drawing Area'
                );
              });

              if (existingFrame) {
                setFrameId(existingFrame);
                editor.zoomToFit();
                return;
              }

              // Create a centered frame for drawing
              const { width, height } = editor.getViewportPageBounds();
              const frameWidth = Math.min(800, width * 0.6);
              const frameHeight = Math.min(600, height * 0.6);
              const x = (width - frameWidth) / 2;
              const y = (height - frameHeight) / 2;

              const frameShapeId = createShapeId();
              editor.createShapes([
                {
                  id: frameShapeId,
                  type: 'frame',
                  x,
                  y,
                  props: {
                    w: frameWidth,
                    h: frameHeight,
                    name: 'Drawing Area',
                  },
                },
              ]);

              setFrameId(frameShapeId);

              // Zoom to fit the frame
              editor.zoomToFit();
            }}
          />
        </div>
      </div>

      {/* Right Sidebar - Generated Image & Controls */}
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
              <span className="text-sm text-gray-500">No image generated yet</span>
            )}
          </div>
          {!imageUsed && (
            <div className="flex gap-3">
              <Button
                onClick={handleAcceptImage}
                variant="outline"
                className="flex-1 border-2 border-green-600 bg-green-50 text-green-700 shadow-sm hover:bg-green-100 hover:text-green-800"
                disabled={!frameId || !editorRef.current}
              >
                Accept (Tab)
              </Button>
              <Button
                onClick={handleRejectImage}
                variant="outline"
                className="flex-1 border-2 border-red-600 bg-red-50 text-red-700 shadow-sm hover:bg-red-100 hover:text-red-800"
                disabled={!frameId || !editorRef.current}
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
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full bg-white"
          />
        </div>

        {/* Microphone Control */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-900">Voice Input</label>
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
          <div className="rounded-md border border-red-500 bg-red-50 p-3 text-sm text-red-900">
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
