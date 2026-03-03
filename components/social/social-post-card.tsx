'use client';

import { BarChart3, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteSocialPostAction } from '@/modules/social/actions';
import { isSocialPostStatus, type SocialPostStatus } from '@/lib/types/social';
import { SocialStatusBadge } from './social-status-badge';
import { SocialStatusSelect } from './social-status-select';
import { SocialPostFormModal } from './social-post-form-modal';
import { SocialPerformanceModal } from './social-performance-modal';
import { Button } from '@/components/ui/button';

function normalizeStatus(value: string): SocialPostStatus {
  return isSocialPostStatus(value) ? value : 'IDEA';
}

function formatDateTime(value: Date | string | null): string {
  if (!value) {
    return 'Not scheduled';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function SocialPostCard({
  post,
  showStatusSelect = false,
  openEditOnCardClick = false
}: {
  post: {
    id: string;
    title: string;
    type: string;
    status: string;
    platforms: string[];
    caption: string | null;
    hashtags: string | null;
    scheduledFor: Date | string | null;
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  showStatusSelect?: boolean;
  openEditOnCardClick?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const status = normalizeStatus(post.status);

  async function handleDelete() {
    const confirmed = window.confirm('Delete this post?');

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    const formData = new FormData();
    formData.set('id', post.id);

    const result = await deleteSocialPostAction(formData);

    if (!result.success) {
      toast.error(result.message);
      setIsDeleting(false);
      return;
    }

    toast.success(result.message);
    setIsDeleting(false);
    router.refresh();
  }

  return (
    <>
      <article
        onClick={() => {
          if (openEditOnCardClick) {
            setEditOpen(true);
          }
        }}
        className={`rounded-2xl border border-[#27272A] bg-[#111113] p-4 transition duration-200 ease-in-out hover:border-[#3f3f46] ${
          openEditOnCardClick ? 'cursor-pointer' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#FAFAFA]">{post.title}</p>
            <p className="mt-1 text-xs text-[#A1A1AA]">{post.platforms.join(', ')} • {post.type}</p>
          </div>
          <SocialStatusBadge status={status} />
        </div>

        <p className="mt-3 text-xs text-[#A1A1AA]">Scheduled: {formatDateTime(post.scheduledFor)}</p>

        {post.caption ? <p className="mt-2 text-sm text-[#A1A1AA]">{post.caption}</p> : null}
        {post.hashtags ? <p className="mt-1 text-xs text-[#FF8124]">{post.hashtags}</p> : null}

        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs text-[#A1A1AA]">
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-2 py-1">Likes {post.likes}</div>
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-2 py-1">Comments {post.comments}</div>
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-2 py-1">Shares {post.shares}</div>
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-2 py-1">Views {post.views}</div>
        </div>

        <div
          className="mt-3 flex flex-wrap items-center justify-between gap-2"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          {showStatusSelect ? <SocialStatusSelect postId={post.id} currentStatus={status} /> : <div />}

          <div className="flex items-center gap-1">
            <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>

            <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={() => setPerformanceOpen(true)}>
              <BarChart3 className="h-3.5 w-3.5" />
              Performance
            </Button>

            <Button type="button" variant="danger" className="px-3 py-1.5" loading={isDeleting} onClick={() => {
              handleDelete().catch(() => {
                toast.error('Failed to delete post');
                setIsDeleting(false);
              });
            }}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </article>

      <SocialPostFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialPost={{
          id: post.id,
          title: post.title,
          type: post.type,
          status,
          platforms: post.platforms,
          caption: post.caption,
          hashtags: post.hashtags,
          scheduledFor: post.scheduledFor
        }}
      />

      <SocialPerformanceModal
        open={performanceOpen}
        onClose={() => setPerformanceOpen(false)}
        post={{
          id: post.id,
          title: post.title,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          views: post.views
        }}
      />
    </>
  );
}
