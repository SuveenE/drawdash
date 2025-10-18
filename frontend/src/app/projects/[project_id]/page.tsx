'use client';

import { useParams } from 'next/navigation';

import { useCallback, useEffect, useRef, useState } from 'react';

import { generateImage } from '@/actions/image';
import { DEFAULT_USER_ID, updateProject } from '@/actions/projects';
import { useProject } from '@/hooks/useProject';
import { useQueryClient } from '@tanstack/react-query';
import { Tldraw, createShapeId, getSnapshot, loadSnapshot } from 'tldraw';
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
  const queryClient = useQueryClient();

  // Fetch project data
  const { data: project } = useProject(projectId, DEFAULT_USER_ID);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState<'agent' | 'ask'>('agent'); // Explicit mode tracking
  const [agentTranscript, setAgentTranscript] = useState(''); // Voice transcript for Agent Mode
  const [askPrompt, setAskPrompt] = useState(''); // Text input for Ask Mode
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
  const agentTranscriptRef = useRef<string>('');
  const handleGenerateRef = useRef<(() => Promise<void>) | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedSnapshotRef = useRef(false);

  // Keep agent transcript ref in sync with agent transcript state
  useEffect(() => {
    console.log('[TRANSCRIPT-REF] Updating agentTranscriptRef to:', agentTranscript);
    agentTranscriptRef.current = agentTranscript;
  }, [agentTranscript]);

  // Keep isListening ref in sync with isListening state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

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

          if (finalTranscript) {
            console.log('[SPEECH] Final transcript received:', finalTranscript);
            // Voice input is only for Agent Mode
            setAgentTranscript((prev) => {
              const newTranscript = prev + finalTranscript;
              console.log('[SPEECH] Updated agentTranscript:', newTranscript);
              return newTranscript;
            });
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          console.log('[SPEECH] Recognition ended - checking if should restart...');
          console.log('[SPEECH] isListeningRef.current:', isListeningRef.current);

          // If we're still supposed to be listening (user didn't manually stop),
          // restart the recognition to keep it going
          if (isListeningRef.current) {
            console.log('[SPEECH] Auto-restarting recognition to continue listening');
            try {
              recognitionRef.current?.start();
            } catch (err) {
              console.error('[SPEECH] Failed to restart recognition:', err);
              setIsListening(false);
            }
          } else {
            console.log('[SPEECH] User stopped listening, not restarting');
            setIsListening(false);
          }
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-generate in Agent Mode after 20 seconds of listening
  useEffect(() => {
    // Only set timer if in Agent Mode and listening has started
    if (mode === 'agent' && isListening && editorRef.current && frameId) {
      console.log('[AUTO-GEN] Agent Mode listening started: Setting 20-second timer');
      autoGenerateTimerRef.current = setTimeout(() => {
        // In Agent Mode, use the agent transcript ref
        const agentTranscript = agentTranscriptRef.current.trim();
        console.log('[AUTO-GEN] Timer fired! Agent transcript:', agentTranscript);
        console.log('[AUTO-GEN] handleGenerateRef exists?', !!handleGenerateRef.current);

        if (agentTranscript && handleGenerateRef.current) {
          console.log('[AUTO-GEN] Triggering auto-generate with transcript:', agentTranscript);
          handleGenerateRef.current();
        } else {
          console.log('[AUTO-GEN] Skipping - no transcript or handler');
        }
      }, 20000); // 20 seconds
    } else {
      console.log(
        '[AUTO-GEN] Not setting timer. mode:',
        mode,
        'isListening:',
        isListening,
        'frameId:',
        !!frameId,
        'editor:',
        !!editorRef.current,
      );
    }

    // Cleanup on unmount or when listening stops
    return () => {
      if (autoGenerateTimerRef.current) {
        console.log('[AUTO-GEN] Clearing timer due to cleanup');
        clearTimeout(autoGenerateTimerRef.current);
        autoGenerateTimerRef.current = null;
      }
    };
  }, [mode, isListening, frameId]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      console.log('[TOGGLE] Stopping listening');
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      console.log('[TOGGLE] Starting listening in Agent Mode');
      // Clear agent transcript when starting new listening session
      setAgentTranscript('');
      console.log('[TOGGLE] Cleared agentTranscript');
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
    console.log('exportCanvasImage: Starting export...');
    console.log('exportCanvasImage: editorRef.current:', !!editorRef.current);
    console.log('exportCanvasImage: frameId:', frameId);

    if (!editorRef.current || !frameId) {
      console.log('exportCanvasImage: No editor or frameId, returning null');
      return null;
    }

    const editor = editorRef.current;

    // Debug: Check all shapes on the current page
    const allShapeIds = Array.from(editor.getCurrentPageShapeIds());
    console.log('exportCanvasImage: All shape IDs on page:', allShapeIds);
    console.log('exportCanvasImage: Looking for frameId:', frameId);

    const frame = editor.getShape(frameId);
    console.log('exportCanvasImage: frame object:', frame);

    if (!frame) {
      console.log('exportCanvasImage: No frame found, returning null');
      console.log('exportCanvasImage: This might be a timing issue or frameId mismatch');
      return null;
    }

    console.log('exportCanvasImage: Frame found successfully, type:', frame.type);

    // Get all shapes that are children of the frame
    const childShapeIds = editor.getSortedChildIdsForParent(frameId).filter((id: string) => {
      const shape = editor.getShape(id);
      return shape && !shape.isLocked;
    });

    console.log('exportCanvasImage: childShapeIds count:', childShapeIds.length);

    // Include the frame itself and all its children for export
    const shapeIdsToExport = [frameId, ...childShapeIds];

    console.log('exportCanvasImage: shapeIdsToExport count:', shapeIdsToExport.length);

    // Export only the frame and its contents to PNG
    // Note: shapeIdsToExport will always have at least the frame itself
    const { blob } = await editor.toImage(shapeIdsToExport, {
      format: 'png',
      background: true,
      padding: 0,
    });

    console.log('exportCanvasImage: Blob created, size:', blob.size);

    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data:image/png;base64, prefix
        const base64 = base64data.split(',')[1];
        console.log('exportCanvasImage: Base64 created, length:', base64?.length || 0);
        resolve(base64);
      };
      reader.onerror = (error) => {
        console.error('exportCanvasImage: FileReader error:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  }, [frameId]);

  const handleGenerate = useCallback(async () => {
    // Get the appropriate prompt based on mode
    const prompt = mode === 'agent' ? agentTranscript : askPrompt;

    if (!prompt.trim()) {
      setError(mode === 'agent' ? 'Please provide a voice prompt first' : 'Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Always export canvas image - needed for both generate and edit modes
      console.log('Exporting canvas image...');
      const canvasImageData = await exportCanvasImage();
      console.log(
        'Canvas image data:',
        canvasImageData ? `${canvasImageData.length} chars` : 'null',
      );

      // Check if canvas has content to determine request type
      const editor = editorRef.current;
      const hasContent = frameId && editor?.getSortedChildIdsForParent(frameId).length > 0;
      const requestType = hasContent ? 'edit' : 'generate';
      console.log('Request type:', requestType, '(mode:', mode, ', hasContent:', hasContent, ')');

      const data = await generateImage({
        prompt: prompt,
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
  }, [mode, agentTranscript, askPrompt, exportCanvasImage, projectId, frameId]);

  // Keep handleGenerate ref in sync
  useEffect(() => {
    handleGenerateRef.current = handleGenerate;
  }, [handleGenerate]);

  // Start editing project name
  const startEditingName = useCallback(() => {
    if (project?.name) {
      setEditedName(project.name);
      setIsEditingName(true);
    }
  }, [project?.name]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Save edited project name
  const saveProjectName = useCallback(async () => {
    if (!editedName.trim() || !project) {
      setIsEditingName(false);
      return;
    }

    if (editedName.trim() === project.name) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateProject(projectId, DEFAULT_USER_ID, {
        name: editedName.trim(),
      });
      // Invalidate and refetch the project data
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsEditingName(false);
    } catch (err) {
      console.error('Error updating project name:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project name');
      setIsEditingName(false);
    }
  }, [editedName, project, projectId, queryClient]);

  // Cancel editing project name
  const cancelEditingName = useCallback(() => {
    setIsEditingName(false);
    setEditedName('');
  }, []);

  // Handle keyboard events for name editing
  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveProjectName();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditingName();
      }
    },
    [saveProjectName, cancelEditingName],
  );

  // Save canvas state to database
  const saveCanvas = useCallback(async () => {
    if (!editorRef.current) {
      return;
    }

    setIsSaving(true);

    try {
      const editor = editorRef.current;
      const snapshot = getSnapshot(editor.store);

      await updateProject(projectId, DEFAULT_USER_ID, {
        snapshot: snapshot.document as unknown as Record<string, unknown>,
      });

      console.log('Canvas saved successfully');
    } catch (err) {
      console.error('Error saving canvas:', err);
      setError(err instanceof Error ? err.message : 'Failed to save canvas');
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  // Load canvas state from database when project loads
  useEffect(() => {
    if (!editorRef.current || !project?.snapshot || !frameId || hasLoadedSnapshotRef.current)
      return;

    try {
      const editor = editorRef.current;
      // Load the snapshot into the store as a remote change to avoid triggering auto-save
      editor.store.mergeRemoteChanges(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loadSnapshot(editor.store, { document: project.snapshot as any });
      });

      // After loading snapshot, find the frame and update frameId state
      // The snapshot may have a different frame ID than the initial one
      const existingShapes = Array.from(editor.getCurrentPageShapeIds());
      const existingFrame = existingShapes.find((id) => {
        const shape = editor.getShape(id);
        return (
          shape?.type === 'frame' && (shape.props as { name?: string })?.name === 'Drawing Area'
        );
      });

      if (existingFrame && existingFrame !== frameId) {
        console.log('Updating frameId after snapshot load:', existingFrame);
        setFrameId(existingFrame as string);
      }

      hasLoadedSnapshotRef.current = true;
      console.log('Canvas loaded from database');
    } catch (err) {
      console.error('Error loading canvas:', err);
      setError(err instanceof Error ? err.message : 'Failed to load canvas');
    }
  }, [project?.snapshot, frameId]);

  // Auto-save with debounce - listen for canvas changes
  useEffect(() => {
    if (!editorRef.current || !frameId) return;

    const editor = editorRef.current;

    // Listen for changes to the document
    const unlisten = editor.store.listen(
      () => {
        // Clear any existing timer
        if (saveDebounceTimerRef.current) {
          clearTimeout(saveDebounceTimerRef.current);
        }

        // Set new timer to save after 2.5 seconds of inactivity
        saveDebounceTimerRef.current = setTimeout(() => {
          // Only save if we've loaded the initial snapshot
          if (hasLoadedSnapshotRef.current) {
            saveCanvas();
          }
        }, 2500);
      },
      { scope: 'document', source: 'user' },
    );

    // Cleanup
    return () => {
      unlisten();
      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
      }
    };
  }, [frameId, saveCanvas]);

  return (
    <div className="flex h-full w-full bg-white">
      {/* Left Side - Drawing Canvas */}
      <div className="flex flex-1 flex-col bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white p-3 pl-4 text-left text-sm font-medium text-gray-900">
          <div>
            <span className="text-gray-500">Projects/</span>
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={saveProjectName}
                onKeyDown={handleNameKeyDown}
                className="mx-1 border-none bg-transparent px-1 text-gray-900 underline outline-none"
              />
            ) : (
              <span
                className="cursor-pointer px-1 underline decoration-gray-400 decoration-dotted underline-offset-2 hover:decoration-gray-600"
                onClick={startEditingName}
                title="Click to edit project name"
              >
                {project?.name || 'Loading...'}
              </span>
            )}
          </div>
          {isSaving && <span className="text-xs text-gray-400">Saving...</span>}
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
        transcript={mode === 'agent' ? agentTranscript : askPrompt}
        isListening={isListening}
        isGenerating={isGenerating}
        error={error}
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          // Stop listening when switching modes
          if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
          }
        }}
        onTranscriptChange={(value) => {
          // Update the appropriate state based on current mode
          if (mode === 'agent') {
            setAgentTranscript(value);
          } else {
            setAskPrompt(value);
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
