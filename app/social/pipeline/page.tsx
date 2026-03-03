import { Film, Lightbulb, Scissors, Send, Upload } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { SocialStatusBadge } from '@/components/social/social-status-badge';
import { SocialStatusSelect } from '@/components/social/social-status-select';
import { Card } from '@/components/ui/card';
import { isSocialPostStatus, SOCIAL_POST_STATUSES, type SocialPostStatus } from '@/lib/types/social';
import { formatDate } from '@/lib/utils/format';
import { getPipelinePostsGrouped } from '@/modules/social/queries';

export const dynamic = 'force-dynamic';

const sectionIcons: Record<SocialPostStatus, React.ComponentType<{ className?: string }>> = {
  IDEA: Lightbulb,
  FILMING: Film,
  EDITING: Scissors,
  SCHEDULED: Send,
  POSTED: Upload
};

function normalizeStatus(value: string): SocialPostStatus {
  return isSocialPostStatus(value) ? value : 'IDEA';
}

export default async function SocialPipelinePage() {
  const grouped = await getPipelinePostsGrouped();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Content Pipeline"
        subtitle="Manage creative flow from idea capture through final publish execution."
      />

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {SOCIAL_POST_STATUSES.map((status) => {
          const Icon = sectionIcons[status];
          const posts = grouped[status];

          return (
            <Card key={status}>
              <div className="mb-4 flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#FF8124]" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">{status}</h2>
                <span className="ml-auto text-xs text-[#A1A1AA]">{posts.length}</span>
              </div>

              {posts.length === 0 ? (
                <p className="text-sm text-[#A1A1AA]">No posts in this stage.</p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => {
                    const postStatus = normalizeStatus(post.status);

                    return (
                      <article key={post.id} className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#FAFAFA]">{post.title}</p>
                            <p className="mt-1 text-xs text-[#A1A1AA]">{post.platforms.join(', ')}</p>
                          </div>
                          <SocialStatusBadge status={postStatus} />
                        </div>

                        <div className="mt-3 grid gap-1 text-xs text-[#A1A1AA]">
                          <p>Type: {post.type}</p>
                          <p>Scheduled: {post.scheduledFor ? formatDate(post.scheduledFor) : 'Not scheduled'}</p>
                        </div>

                        <div className="mt-3">
                          <SocialStatusSelect postId={post.id} currentStatus={postStatus} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
