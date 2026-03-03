'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SocialPostFormModal } from './social-post-form-modal';

export function NewSocialPostButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        + New Post
      </Button>

      <SocialPostFormModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
