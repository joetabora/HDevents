import { BarChart3, Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { SOCIAL_PLATFORMS } from '@/lib/types/social';
import { getPerformanceSummary } from '@/modules/social/queries';

export const dynamic = 'force-dynamic';

export default async function SocialPerformancePage() {
  const summary = await getPerformanceSummary();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Performance Summary"
        subtitle="Public Engagement Tracker with manual override support and score leaderboard."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SOCIAL_PLATFORMS.map((platform) => {
          const totals = summary.platformTotals[platform];

          return (
            <Card key={platform}>
              <p className="text-sm font-semibold text-[#FAFAFA]">{platform}</p>
              <div className="mt-3 space-y-1 text-xs text-[#A1A1AA]">
                <p>Likes: {totals.likes}</p>
                <p>Comments: {totals.comments}</p>
                <p>Shares: {totals.shares}</p>
                <p>Views: {totals.views}</p>
                <p>Posts: {totals.posts}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#FF8124]" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Top 10 Posts by Score</h2>
        </div>

        {summary.leaderboard.length === 0 ? (
          <p className="text-sm text-[#A1A1AA]">No posted content available yet.</p>
        ) : (
          <ul className="space-y-2">
            {summary.leaderboard.map((post, index) => (
              <li key={post.id} className="flex items-center justify-between rounded-2xl border border-[#27272A] bg-[#111113] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#FAFAFA]">
                    #{index + 1} {post.title}
                  </p>
                  <p className="text-xs text-[#A1A1AA]">{post.platforms.join(', ')}</p>
                </div>
                <div className="text-right">
                  <Eye className="ml-auto h-4 w-4 text-[#FF8124]" />
                  <p className="text-sm font-semibold text-[#FAFAFA]">Score {post.score.toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
