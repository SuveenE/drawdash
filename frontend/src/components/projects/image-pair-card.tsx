'use client';

import Image from 'next/image';

import { ImagePair } from '@/actions/image-pairs';

interface ImagePairCardProps {
  imagePair: ImagePair;
}

export function ImagePairCard({ imagePair }: ImagePairCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md">
      <div className="grid grid-cols-2 gap-4">
        {/* Input Image */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Input</h3>
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
            <Image src={imagePair.input_url} alt="Input image" fill className="object-contain" />
          </div>
          {imagePair.input_width && imagePair.input_height && (
            <p className="mt-1 text-xs text-gray-500">
              {imagePair.input_width} × {imagePair.input_height}
            </p>
          )}
        </div>

        {/* Output Image */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Output</h3>
          {imagePair.output_url ? (
            <>
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                <Image
                  src={imagePair.output_url}
                  alt="Output image"
                  fill
                  className="object-contain"
                />
              </div>
              {imagePair.output_width && imagePair.output_height && (
                <p className="mt-1 text-xs text-gray-500">
                  {imagePair.output_width} × {imagePair.output_height}
                </p>
              )}
            </>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-md bg-gray-100">
              <p className="text-sm text-gray-400">No output</p>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Text */}
      {imagePair.prompt_text && (
        <div className="mt-4">
          <h3 className="mb-1 text-sm font-semibold text-gray-700">Prompt</h3>
          <p className="text-sm text-gray-600">{imagePair.prompt_text}</p>
        </div>
      )}

      {/* Timestamp */}
      <p className="mt-3 text-xs text-gray-500">
        Created: {new Date(imagePair.created_at).toLocaleString()}
      </p>
    </div>
  );
}
