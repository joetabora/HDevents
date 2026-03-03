'use client';

import { BarChart3, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { NewTaskButton } from '@/components/tasks/new-task-button';
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

function computeScore(metrics: { likes: number; comments: number; shares: number; views: number }): number {
  return Math.round(metrics.likes + metrics.comments * 3 + metrics.shares * 5 + metrics.views / 10);
}

export function SocialPostCard({
  post,
  showStatusSelect = false,
  openEditOnCardClick = false,
  allowEdit = true,
  allowDelete = true,
  allowPerformance = true,
  taskUsers = []
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
    publicLikes?: number;
    publicComments?: number;
    publicShares?: number;
    publicViews?: number;
    postUrl?: string | null;
  };
  showStatusSelect?: boolean;
  openEditOnCardClick?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowPerformance?: boolean;
  taskUsers?: Array<{ id: string; name: string; email: string }>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const status = normalizeStatus(post.status);
  const hasPublicMetrics =
    (post.publicLikes ?? 0) > 0 ||
    (post.publicComments ?? 0) > 0 ||
    (post.publicShares ?? 0) > 0 ||
    (post.publicViews ?? 0) > 0;
  const score = computeScore({
    likes: hasPublicMetrics ? (post.publicLikes ?? 0) : post.likes,
    comments: hasPublicMetrics ? (post.publicComments ?? 0) : post.comments,
    shares: hasPublicMetrics ? (post.publicShares ?? 0) : post.shares,
    views: hasPublicMetrics ? (post.publicViews ?? 0) : post.views
  });

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
          if (openEditOnCardClick && allowEdit) {
            setEditOpen(true);
          }
        }}
        className={`rounded-2xl border border-[#27272A] bg-[#111113] p-4 transition duration-200 ease-in-out hover:border-[#3f3f46] ${
          openEditOnCardClick && allowEdit ? 'cursor-pointer' : ''
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

        <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs text-[#A1A1AA]">
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-2 py-1">P Likes {post.publicLikes ?? 0}</div>
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-2 py-1">P Comments {post.publicComments ?? 0}</div>
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-2 py-1">P Shares {post.publicShares ?? 0}</div>
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-2 py-1">P Views {post.publicViews ?? 0}</div>
        </div>

        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#FF8124]">Engagement Score: {score}</p>

        <div
          className="mt-3 flex flex-wrap items-center justify-between gap-2"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          {showStatusSelect ? <SocialStatusSelect postId={post.id} currentStatus={status} disabled={!allowEdit} /> : <div />}

          <div className="flex flex-wrap items-center gap-1">
            {allowEdit ? (
              <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            ) : null}

            {allowPerformance ? (
              <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={() => setPerformanceOpen(true)}>
                <BarChart3 className="h-3.5 w-3.5" />
                Performance
              </Button>
            ) : null}

            {allowDelete ? (
              <Button
                type="button"
                variant="danger"
                className="px-3 py-1.5"
                loading={isDeleting}
                onClick={() => {
                  handleDelete().catch(() => {
                    toast.error('Failed to delete post');
                    setIsDeleting(false);
                  });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            ) : null}

            {allowEdit ? (
              <NewTaskButton label="Task" compact relatedType="SOCIAL" relatedId={post.id} users={taskUsers} />
            ) : null}
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
          postUrl: post.postUrl,
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
          views: post.views,
          postUrl: post.postUrl
        }}
      />
    </>
  );
}
