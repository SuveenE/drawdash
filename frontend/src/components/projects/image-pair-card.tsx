'use client';

import { useEffect, useRef, useState } from 'react';

import { ImagePair } from '@/actions/image-pairs';
import { Maximize2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ImagePairCardProps {
  imagePair: ImagePair;
}

export function ImagePairCard({ imagePair }: ImagePairCardProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updateSliderPosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updateSliderPosition(e.touches[0].clientX);
  };

  // Global mouse event handlers for better drag experience
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSliderPosition(e.clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  if (!imagePair.output_url) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
        <p className="text-sm text-gray-400">No output available</p>
      </div>
    );
  }

  const SliderContent = () => (
    <div
      ref={containerRef}
      className={`relative ${isFullscreen ? 'h-full w-full' : 'aspect-square'} cursor-ew-resize overflow-hidden rounded-lg bg-gray-100 select-none`}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fullscreen button */}
      {!isFullscreen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(true);
          }}
          className="pointer-events-auto absolute top-2 left-2 z-10 h-8 w-8 rounded-md bg-black/50 text-white hover:bg-black/70 hover:text-white"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}

      {/* Close button (fullscreen only) */}
      {isFullscreen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(false);
          }}
          className="pointer-events-auto absolute top-2 right-2 z-10 h-10 w-10 rounded-full bg-red-500/80 text-white hover:bg-red-600 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      {/* Before Image (Input) */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src={imagePair.input_url}
          alt="Before"
          className="h-full w-full object-contain"
          draggable={false}
        />
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Before
        </div>
      </div>

      {/* After Image (Output) - Clipped */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      >
        <img
          src={imagePair.output_url}
          alt="After"
          className="h-full w-full object-contain"
          draggable={false}
        />
        <div className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          After
        </div>
      </div>

      {/* Slider Line and Handle */}
      <div
        className="pointer-events-none absolute inset-y-0 flex items-center"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Vertical Line */}
        <div className="absolute h-full w-1 bg-white shadow-lg" style={{ left: '-2px' }} />

        {/* Slider Handle */}
        <div
          className="pointer-events-auto relative -ml-6 flex h-12 w-12 cursor-ew-resize items-center justify-center rounded-full bg-white shadow-xl ring-4 ring-white/50 transition-transform hover:scale-110"
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleTouchStart(e);
          }}
        >
          <div className="pointer-events-none flex gap-1">
            <div className="h-6 w-1 rounded-full bg-gray-400" />
            <div className="h-6 w-1 rounded-full bg-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <SliderContent />

        {/* Timestamp */}
        <div className="p-3">
          <p className="text-xs text-gray-500">{new Date(imagePair.created_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="h-full w-full p-8" onClick={(e) => e.stopPropagation()}>
            <SliderContent />
          </div>
        </div>
      )}
    </>
  );
}
