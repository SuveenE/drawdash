'use client';

import ThemeToggle from '@/components/shared/theme/toggle';

export default function Header() {
  return (
    <div className="px flex w-full items-center justify-end gap-4">
      <ThemeToggle />
      {/* Other Navigation Buttons */}
    </div>
  );
}
