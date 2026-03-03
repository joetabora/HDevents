import { Bike, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils/format';
import { getDailyOutputSummary, getUsedBikePostsPostedToday } from '@/modules/social/queries';

export const dynamic = 'force-dynamic';

export default async function SocialOutputPage() {
  const [summary, posts] = await Promise.all([getDailyOutputSummary(), getUsedBikePostsPostedToday()]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Daily Output Tracker"
        subtitle="Track completion against the 4 used-bike posts target for today."
      />

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#A1A1AA]">Used Bike Posts Posted Today</p>
            <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">
              {summary.completed} / {summary.goal}
            </p>
          </div>
          <Bike className="h-6 w-6 text-[#FF8124]" />
        </div>

        <div className="mt-4 h-3 rounded-full bg-[#111113]">
          <div className="h-3 rounded-full bg-[#FF6A00]" style={{ width: `${summary.progressPercent}%` }} />
        </div>
        <p className="mt-2 text-xs text-[#A1A1AA]">{summary.progressPercent}% complete</p>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Posted Used Bikes (Today)</h2>

        {posts.length === 0 ? (
          <p className="text-sm text-[#A1A1AA]">No used-bike posts marked POSTED for today yet.</p>
        ) : (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post.id} className="flex items-center justify-between rounded-2xl border border-[#27272A] bg-[#111113] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#FAFAFA]">{post.title}</p>
                  <p className="text-xs text-[#A1A1AA]">{post.platforms.join(', ')}</p>
                </div>
                <div className="text-right">
                  <CheckCircle2 className="ml-auto h-4 w-4 text-[#FF8124]" />
                  <p className="mt-1 text-xs text-[#A1A1AA]">{post.scheduledFor ? formatDate(post.scheduledFor) : 'Today'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
