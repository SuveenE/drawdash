'use client';

import { useRouter } from 'next/navigation';

import { useState } from 'react';

import { DEFAULT_USER_ID, createProject } from '@/actions/projects';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: () => void;
  showOverlay?: boolean;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
  showOverlay = false,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const handleCreateProject = async () => {
    if (isCreatingProject || !projectName.trim()) return;

    setIsCreatingProject(true);
    try {
      const newProject = await createProject({
        user_id: DEFAULT_USER_ID,
        name: projectName.trim(),
        description: '',
      });

      toast.success('Project created successfully!');
      onOpenChange(false);
      setProjectName('');
      router.push(`/projects/${newProject.id}`);
      onProjectCreated?.();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && projectName.trim()) {
      handleCreateProject();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setProjectName('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        {showOverlay && <DialogOverlay />}
        <DialogPrimitive.Content
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-900 bg-white p-6 shadow-2xl duration-200 sm:max-w-md sm:rounded-lg',
          )}
        >
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Give your project a name to get started.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              id="name"
              placeholder="Enter project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-black"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreatingProject}
              className="border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateProject}
              disabled={isCreatingProject || !projectName.trim()}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isCreatingProject ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
          <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
