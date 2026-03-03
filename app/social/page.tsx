import { AlertTriangle, CalendarClock, Flame, Gauge, Goal } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { NewSocialPostButton } from '@/components/social/new-social-post-button';
import { SocialPostCard } from '@/components/social/social-post-card';
import { Card } from '@/components/ui/card';
import { getSocialDashboardSummary } from '@/modules/social/queries';

export const dynamic = 'force-dynamic';

export default async function SocialDashboardPage() {
  const summary = await getSocialDashboardSummary();
  const usedBikePercent = Math.min(100, Math.round((summary.usedBikesPostedToday / summary.usedBikeGoal) * 100));

  return (
    <div className="space-y-10">
      <PageHeader
        title="Social Control Center"
        subtitle="Monitor momentum, posting cadence, and pipeline pressure across the next seven days."
        right={<NewSocialPostButton />}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Used Bikes Today</p>
            <Goal className="h-4 w-4 text-[#FF8124]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#FAFAFA]">
            {summary.usedBikesPostedToday} / {summary.usedBikeGoal}
          </p>
          <div className="mt-3 h-2 rounded-full bg-[#111113]">
            <div className="h-2 rounded-full bg-[#FF6A00]" style={{ width: `${usedBikePercent}%` }} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Total Posts Today</p>
            <Flame className="h-4 w-4 text-[#FF8124]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#FAFAFA]">{summary.totalPostsToday}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Momentum Score</p>
            <Gauge className="h-4 w-4 text-[#FF8124]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#FAFAFA]">{summary.momentumScore}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Overdue Posts</p>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <p className={`mt-3 text-3xl font-bold ${summary.overduePosts > 0 ? 'text-rose-400' : 'text-[#FAFAFA]'}`}>
            {summary.overduePosts}
          </p>
        </Card>
      </section>

      <section>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Upcoming Scheduled Posts</h2>
              <p className="mt-1 text-xs text-[#A1A1AA]">Next 7 days</p>
            </div>
            <CalendarClock className="h-4 w-4 text-[#FF8124]" />
          </div>

          {summary.upcomingScheduledPosts.length === 0 ? (
            <p className="text-sm text-[#A1A1AA]">No scheduled posts in the next week.</p>
          ) : (
            <div className="space-y-3">
              {summary.upcomingScheduledPosts.map((post) => (
                <SocialPostCard
                  key={post.id}
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
                  showStatusSelect
                  openEditOnCardClick
                />
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
