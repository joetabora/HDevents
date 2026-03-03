import { Film, Lightbulb, Scissors, Send, Upload } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { NewSocialPostButton } from '@/components/social/new-social-post-button';
import { SocialPostCard } from '@/components/social/social-post-card';
import { Card } from '@/components/ui/card';
import { isSocialPostStatus, SOCIAL_POST_STATUSES, type SocialPostStatus } from '@/lib/types/social';
import { getPipelinePostsGrouped } from '@/modules/social/queries';
import { canDeleteRecords, canEditContent, canUpdatePerformance } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';
import { listUserOptions } from '@/modules/users/services';

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
  const currentUser = await requireCurrentUserPage();
  const [grouped, userOptions] = await Promise.all([
    getPipelinePostsGrouped(),
    canEditContent(currentUser.role) ? listUserOptions() : Promise.resolve([])
  ]);
  const allowEdit = canEditContent(currentUser.role);
  const allowDelete = canDeleteRecords(currentUser.role);
  const allowPerformance = canUpdatePerformance(currentUser.role);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Content Pipeline"
        subtitle="Manage creative flow from idea capture through final publish execution."
        right={allowEdit ? <NewSocialPostButton /> : null}
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
                      <SocialPostCard
                        key={post.id}
                        post={{
                          id: post.id,
                          title: post.title,
                          type: post.type,
                          status: postStatus,
                          platforms: post.platforms,
                          caption: post.caption,
                          hashtags: post.hashtags,
                          scheduledFor: post.scheduledFor,
                          likes: post.likes,
                          comments: post.comments,
                          shares: post.shares,
                          views: post.views,
                          publicLikes: post.publicLikes,
                          publicComments: post.publicComments,
                          publicShares: post.publicShares,
                          publicViews: post.publicViews,
                          postUrl: post.postUrl
                        }}
                        showStatusSelect={allowEdit}
                        openEditOnCardClick={allowEdit}
                        allowEdit={allowEdit}
                        allowDelete={allowDelete}
                        allowPerformance={allowPerformance}
                        taskUsers={userOptions}
                      />
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
