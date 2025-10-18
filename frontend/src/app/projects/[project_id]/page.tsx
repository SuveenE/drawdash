'use client';

import { useParams } from 'next/navigation';

import { useCallback, useEffect, useRef, useState } from 'react';

import { generateImage } from '@/actions/image';
import { DEFAULT_USER_ID } from '@/actions/projects';
import { useProject } from '@/hooks/useProject';
import { Tldraw, createShapeId } from 'tldraw';
import 'tldraw/tldraw.css';

import { BeforeAfterSlider } from '@/components/canvas/before-after-slider';
import { ImageSidebar } from '@/components/canvas/image-sidebar';

// Extend Window interface for Speech Recognition API
interface WindowWithSpeechRecognition extends Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SpeechRecognition?: new () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webkitSpeechRecognition?: new () => any;
}

export default function ProjectCanvasPage() {
  const params = useParams();
  const projectId = params.project_id as string;

  // Fetch project data
  const { data: project } = useProject(projectId, DEFAULT_USER_ID);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [agentTranscript, setAgentTranscript] = useState(''); // Transcript for Agent Mode
  const [askTranscript, setAskTranscript] = useState(''); // Transcript for Ask Mode
  const [error, setError] = useState<string | null>(null);
  const [frameId, setFrameId] = useState<string | null>(null);
  const [imageUsed, setImageUsed] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [frameBounds, setFrameBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const autoGenerateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');
  const handleGenerateRef = useRef<(() => Promise<void>) | null>(null);

  // Helper to determine current mode (Agent Mode = empty canvas, Ask Mode = has content)
  const isAgentMode = useCallback((): boolean => {
    if (!editorRef.current || !frameId) return true; // Default to Agent Mode if not ready
    const editor = editorRef.current;
    const childShapeIds = editor.getSortedChildIdsForParent(frameId);
    return childShapeIds.length === 0;
  }, [frameId]);

  // Get the appropriate transcript based on current mode
  const currentTranscript = isAgentMode() ? agentTranscript : askTranscript;

  // Keep transcript ref in sync with current transcript
  useEffect(() => {
    transcriptRef.current = currentTranscript;
  }, [currentTranscript]);

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

          // Update the appropriate transcript based on current mode
          if (isAgentMode()) {
            setAgentTranscript((prev) => prev + finalTranscript);
          } else {
            setAskTranscript((prev) => prev + finalTranscript);
          }
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
  }, [isAgentMode]);

  // Auto-generate in Agent Mode after 20 seconds of listening
  useEffect(() => {
    // Clear any existing timer
    if (autoGenerateTimerRef.current) {
      clearTimeout(autoGenerateTimerRef.current);
      autoGenerateTimerRef.current = null;
    }

    // Only set timer if listening has started
    if (isListening && editorRef.current && frameId) {
      // Check if canvas is empty (Agent Mode)
      const editor = editorRef.current;
      const childShapeIds = editor.getSortedChildIdsForParent(frameId);
      const isCanvasEmpty = childShapeIds.length === 0;

      if (isCanvasEmpty) {
        console.log('Agent Mode detected: Auto-generate will trigger in 20 seconds');
        autoGenerateTimerRef.current = setTimeout(() => {
          // Only auto-generate if we have a transcript (use ref to get latest value)
          const currentTranscript = transcriptRef.current.trim();
          if (currentTranscript && handleGenerateRef.current) {
            console.log(
              'Auto-generating image after 20 seconds in Agent Mode with transcript:',
              currentTranscript,
            );
            handleGenerateRef.current();
          } else {
            console.log('No transcript available yet, skipping auto-generate');
          }
        }, 20000); // 20 seconds
      }
    }

    // Cleanup on unmount or when listening stops
    return () => {
      if (autoGenerateTimerRef.current) {
        clearTimeout(autoGenerateTimerRef.current);
        autoGenerateTimerRef.current = null;
      }
    };
  }, [isListening, frameId, isAgentMode]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Clear the appropriate transcript based on current mode
      if (isAgentMode()) {
        setAgentTranscript('');
      } else {
        setAskTranscript('');
      }
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Helper to capture current canvas state as data URL
  const captureCanvasSnapshot = useCallback(async (): Promise<string | null> => {
    if (!editorRef.current || !frameId) return null;

    const editor = editorRef.current;
    const frame = editor.getShape(frameId);
    if (!frame) return null;

    const childShapeIds = editor.getSortedChildIdsForParent(frameId).filter((id: string) => {
      const shape = editor.getShape(id);
      return shape && !shape.isLocked;
    });

    const shapeIdsToExport = [frameId, ...childShapeIds];

    const { blob } = await editor.toImage(shapeIdsToExport, {
      format: 'png',
      background: true,
      padding: 0,
    });

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }, [frameId]);

  // Helper to create a preview with the new image
  const createAfterPreview = useCallback(
    async (imageBase64: string): Promise<string | null> => {
      if (!editorRef.current || !frameId) return null;

      const editor = editorRef.current;
      const frame = editor.getShape(frameId);
      if (!frame) return null;

      // Store current state to restore later
      const dataUrl = `data:image/png;base64,${imageBase64}`;

      // Get image dimensions
      const img = document.createElement('img');
      const imageLoadPromise = new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
      });
      img.src = dataUrl;
      const { width: imageWidth, height: imageHeight } = await imageLoadPromise;

      // Create temporary asset and shape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tempAssetId = `asset:${createShapeId()}` as any;
      const tempShapeId = createShapeId();

      editor.createAssets([
        {
          id: tempAssetId,
          type: 'image',
          typeName: 'asset',
          props: {
            name: 'preview.png',
            src: dataUrl,
            w: imageWidth,
            h: imageHeight,
            mimeType: 'image/png',
            isAnimated: false,
          },
          meta: {},
        },
      ]);

      const frameProps = frame.props as { w: number; h: number };
      const maxWidth = frameProps.w * 0.8;
      const maxHeight = frameProps.h * 0.8;
      const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);
      const scaledWidth = imageWidth * scale;
      const scaledHeight = imageHeight * scale;
      const imageX = (frameProps.w - scaledWidth) / 2;
      const imageY = (frameProps.h - scaledHeight) / 2;

      editor.createShapes([
        {
          id: tempShapeId,
          type: 'image',
          x: imageX,
          y: imageY,
          parentId: frameId,
          props: {
            w: scaledWidth,
            h: scaledHeight,
            assetId: tempAssetId,
          },
        },
      ]);

      // Wait a tick for the shape to render
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Capture the preview
      const preview = await captureCanvasSnapshot();

      // Clean up temporary shape and asset
      editor.deleteShapes([tempShapeId]);
      editor.deleteAssets([tempAssetId]);

      return preview;
    },
    [frameId, captureCanvasSnapshot],
  );

  // Load test image as base64
  const loadTestImage = useCallback(async (): Promise<string> => {
    const response = await fetch('/test.png');
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }, []);

  // Get frame bounds in screen coordinates
  const getFrameBounds = useCallback(() => {
    if (!editorRef.current || !frameId) return null;

    const editor = editorRef.current;
    const frame = editor.getShape(frameId);
    if (!frame) return null;

    // Get the frame's page bounds (in canvas coordinates)
    const bounds = editor.getShapePageBounds(frameId);

    if (!bounds) return null;

    // Convert canvas coordinates to screen coordinates
    const { x, y } = editor.pageToScreen({ x: bounds.x, y: bounds.y });
    const bottomRight = editor.pageToScreen({ x: bounds.maxX, y: bounds.maxY });

    return {
      x,
      y,
      width: bottomRight.x - x,
      height: bottomRight.y - y,
    };
  }, [frameId]);

  // Show the before/after slider animation
  const handleAcceptImage = useCallback(async () => {
    if (!editorRef.current || !frameId) {
      setError('Canvas not ready');
      return;
    }

    try {
      // If no generated image, use test.png for testing
      let imageToUse = generatedImage;
      if (!imageToUse) {
        const testImageBase64 = await loadTestImage();
        setGeneratedImage(testImageBase64);
        imageToUse = testImageBase64;
      }

      // Capture before state first
      const before = await captureCanvasSnapshot();
      if (!before) {
        setError('Failed to capture canvas state');
        return;
      }

      // Get frame bounds for positioning the slider
      const bounds = getFrameBounds();
      setFrameBounds(bounds);

      // Show the before image immediately to hide canvas operations
      setBeforeImage(before);
      setAfterImage(null); // Will be set shortly
      setShowSlider(true);

      // Small delay to ensure overlay is shown
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create after preview using the image we have (happens behind overlay now)
      const after = await createAfterPreview(imageToUse);
      if (!after) {
        setError('Failed to create preview');
        setShowSlider(false);
        return;
      }

      // Update with the after image
      setAfterImage(after);
    } catch (err) {
      console.error('Error preparing slider:', err);
      setError(err instanceof Error ? err.message : 'Failed to prepare preview');
      setShowSlider(false);
    }
  }, [
    frameId,
    generatedImage,
    loadTestImage,
    captureCanvasSnapshot,
    createAfterPreview,
    getFrameBounds,
  ]);

  // Actually place the image on the canvas (called after slider completes)
  const placeImageOnCanvas = useCallback(async () => {
    if (!editorRef.current || !frameId || !generatedImage) return;

    try {
      const editor = editorRef.current;
      const frame = editor.getShape(frameId);
      if (!frame) return;

      // CLEAR ALL EXISTING SHAPES IN THE FRAME FIRST
      const childShapeIds = editor.getSortedChildIdsForParent(frameId);
      if (childShapeIds.length > 0) {
        editor.deleteShapes(childShapeIds);
      }

      const dataUrl = `data:image/png;base64,${generatedImage}`;

      const img = document.createElement('img');
      const imageLoadPromise = new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
      });
      img.src = dataUrl;
      const { width: imageWidth, height: imageHeight } = await imageLoadPromise;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assetId = `asset:${createShapeId()}` as any;

      editor.createAssets([
        {
          id: assetId,
          type: 'image',
          typeName: 'asset',
          props: {
            name: 'generated.png',
            src: dataUrl,
            w: imageWidth,
            h: imageHeight,
            mimeType: 'image/png',
            isAnimated: false,
          },
          meta: {},
        },
      ]);

      const frameProps = frame.props as { w: number; h: number };
      const maxWidth = frameProps.w * 0.8;
      const maxHeight = frameProps.h * 0.8;
      const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);
      const scaledWidth = imageWidth * scale;
      const scaledHeight = imageHeight * scale;
      const imageX = (frameProps.w - scaledWidth) / 2;
      const imageY = (frameProps.h - scaledHeight) / 2;

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
      setShowSlider(false);
      console.log('Image placed in frame');
    } catch (err) {
      console.error('Error placing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to place image');
    }
  }, [frameId, generatedImage]);

  const handleRejectImage = useCallback(() => {
    setImageUsed(true);
    console.log('Image rejected');
  }, []);

  // Keyboard shortcuts for Accept/Reject
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If slider is showing, ESC cancels it
      if (showSlider && e.key === 'Escape') {
        e.preventDefault();
        setShowSlider(false);
        return;
      }

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
  }, [imageUsed, generatedImage, showSlider, handleAcceptImage, handleRejectImage]);

  const exportCanvasImage = useCallback(async (): Promise<string | null> => {
    if (!editorRef.current || !frameId) return null;

    const editor = editorRef.current;
    const frame = editor.getShape(frameId);

    if (!frame) return null;

    // Get all shapes that are children of the frame
    const childShapeIds = editor.getSortedChildIdsForParent(frameId).filter((id: string) => {
      const shape = editor.getShape(id);
      return shape && !shape.isLocked;
    });

    // Include the frame itself and all its children for export
    const shapeIdsToExport = [frameId, ...childShapeIds];

    if (shapeIdsToExport.length === 0) return null;

    // Export only the frame and its contents to PNG
    const { blob } = await editor.toImage(shapeIdsToExport, {
      format: 'png',
      background: true,
      padding: 0,
    });

    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data:image/png;base64, prefix
        resolve(base64data.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, [frameId]);

  const handleGenerate = useCallback(async () => {
    const activeTranscript = isAgentMode() ? agentTranscript : askTranscript;

    if (!activeTranscript.trim()) {
      setError('Please provide a voice prompt first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const canvasImageData = await exportCanvasImage();

      // Determine type: "generate" for agent mode (no canvas content), "edit" for ask mode (has canvas content)
      const requestType = canvasImageData ? 'edit' : 'generate';

      const data = await generateImage({
        prompt: activeTranscript,
        image_data: canvasImageData,
        project_id: projectId,
        type: requestType,
      });

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
  }, [agentTranscript, askTranscript, exportCanvasImage, projectId, isAgentMode]);

  // Keep handleGenerate ref in sync
  useEffect(() => {
    handleGenerateRef.current = handleGenerate;
  }, [handleGenerate]);

  return (
    <div className="flex h-full w-full bg-white">
      {/* Left Side - Drawing Canvas */}
      <div className="flex flex-1 flex-col bg-white">
        <div className="border-b border-gray-200 bg-white p-3 pl-4 text-left text-sm font-medium text-gray-900">
          <span className="text-gray-500">Projects/</span>
          <span className="px-1">{project?.name || 'Loading...'}</span>
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
      <ImageSidebar
        generatedImage={generatedImage}
        imageUsed={imageUsed}
        transcript={currentTranscript}
        isListening={isListening}
        isGenerating={isGenerating}
        error={error}
        onTranscriptChange={(value) => {
          // Update the appropriate transcript based on current mode
          if (isAgentMode()) {
            setAgentTranscript(value);
          } else {
            setAskTranscript(value);
          }
        }}
        onToggleListening={toggleListening}
        onGenerate={handleGenerate}
        onAcceptImage={handleAcceptImage}
        onRejectImage={handleRejectImage}
        canvasReady={!!(frameId && editorRef.current)}
      />

      {/* Before/After Slider Overlay */}
      {showSlider && beforeImage && (
        <BeforeAfterSlider
          beforeImageUrl={beforeImage}
          afterImageUrl={afterImage || ''}
          onComplete={placeImageOnCanvas}
          onCancel={() => setShowSlider(false)}
          frameBounds={frameBounds || undefined}
        />
      )}
    </div>
  );
}
