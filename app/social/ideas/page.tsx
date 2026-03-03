import { Lightbulb } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { NewSocialPostButton } from '@/components/social/new-social-post-button';
import { SocialPostCard } from '@/components/social/social-post-card';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils/format';
import { getIdeaVaultPosts } from '@/modules/social/queries';

export const dynamic = 'force-dynamic';

export default async function SocialIdeasPage() {
  const ideaPosts = await getIdeaVaultPosts();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Idea Vault"
        subtitle="Capture and shape content concepts before they enter production stages."
        right={<NewSocialPostButton />}
      />

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[#FF8124]" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Idea Backlog</h2>
        </div>

        {ideaPosts.length === 0 ? (
          <p className="text-sm text-[#A1A1AA]">No ideas yet. Use + New Post to add your first concept.</p>
        ) : (
          <div className="space-y-3">
            {ideaPosts.map((post) => (
              <div key={post.id}>
                <SocialPostCard
                  post={{
                    id: post.id,
                    title: post.title,
                    type: post.type,
                    status: post.status,
                    platforms: post.platforms,
                    caption: post.caption,
                    hashtags: post.hashtags,
                    scheduledFor: post.scheduledFor,
                    likes: post.likes,
                    comments: post.comments,
                    shares: post.shares,
                    views: post.views
                  }}
                  openEditOnCardClick
                />
                <p className="mt-2 text-xs text-[#A1A1AA]">Created {formatDate(post.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
