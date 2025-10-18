'use client';

import { useEffect, useRef, useState } from 'react';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface BeforeAfterSliderProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  onComplete: () => void;
  onCancel: () => void;
  frameBounds?: { x: number; y: number; width: number; height: number };
}

export function BeforeAfterSlider({
  beforeImageUrl,
  afterImageUrl,
  onComplete,
  onCancel,
  frameBounds,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-animate slider from left to right - only start when afterImage is ready
  useEffect(() => {
    // Don't start animation until we have the after image
    if (!afterImageUrl) return;

    const animationDuration = 300; // 0.3 seconds
    const startTime = Date.now();
    const startPosition = 0;
    const endPosition = 100;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Ease-in-out function
      const easeInOut =
        progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      const newPosition = startPosition + (endPosition - startPosition) * easeInOut;
      setSliderPosition(newPosition);

      if (progress < 1 && !isDragging) {
        requestAnimationFrame(animate);
      } else if (progress >= 1) {
        // Animation complete - accept the image
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    };

    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isDragging, onComplete, afterImageUrl]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);

    // If slider is at the end, complete the action
    if (sliderPosition >= 95) {
      onComplete();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (sliderPosition >= 95) {
      onComplete();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, sliderPosition]);

  // Calculate position styles for the slider
  const getPositionStyle = () => {
    if (!frameBounds) {
      // Fallback to centered position
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80vw',
        height: '80vh',
      };
    }

    return {
      position: 'fixed' as const,
      left: `${frameBounds.x}px`,
      top: `${frameBounds.y}px`,
      width: `${frameBounds.width}px`,
      height: `${frameBounds.height}px`,
    };
  };

  return (
    <>
      {/* Subtle backdrop */}
      <div className="pointer-events-none fixed inset-0 z-[9999] bg-black/10" />

      {/* Before/After Slider Container - positioned over the frame */}
      <div
        ref={containerRef}
        className="z-[10000] cursor-ew-resize overflow-hidden shadow-xl"
        style={getPositionStyle()}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="absolute top-1 right-1 z-10 h-7 w-7 bg-white/80 text-gray-600 shadow-md hover:bg-white hover:text-gray-900"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Before Image (Background) - Current canvas */}
        <div className="absolute inset-0 bg-white">
          <img src={beforeImageUrl} alt="Before" className="h-full w-full object-contain" />
          <div className="absolute bottom-3 left-3 rounded bg-gray-700/80 px-2 py-1 text-xs font-medium text-white">
            Current
          </div>
        </div>

        {/* After Image (Clipped) - Reveals as slider moves */}
        {afterImageUrl && (
          <div
            className="absolute inset-0 overflow-hidden bg-white"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
              opacity: sliderPosition > 0 ? 1 : 0,
            }}
          >
            <img src={afterImageUrl} alt="After" className="h-full w-full object-contain" />
          </div>
        )}

        {/* Slider Line and Handle */}
        <div
          className="absolute inset-y-0 flex items-center"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Vertical Line */}
          <div className="absolute h-full w-0.5 bg-white shadow-md" style={{ left: '-1px' }} />

          {/* Slider Handle */}
          <div
            className="relative -ml-5 flex h-10 w-10 cursor-ew-resize items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-gray-300 transition-transform hover:scale-110"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div className="flex gap-0.5">
              <div className="h-5 w-0.5 rounded-full bg-gray-400" />
              <div className="h-5 w-0.5 rounded-full bg-gray-400" />
            </div>
          </div>
        </div>

        {/* Instructions - only show briefly */}
        {sliderPosition < 10 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-0.5 text-center text-[10px] text-white">
            Drag or wait • ESC to cancel
          </div>
        )}
      </div>
    </>
  );
}
