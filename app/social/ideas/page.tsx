import { Lightbulb } from 'lucide-react';
import { SubmitButton } from '@/components/forms/submit-button';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { SOCIAL_PLATFORMS, SOCIAL_POST_TYPES } from '@/lib/types/social';
import { formatDate } from '@/lib/utils/format';
import { createIdeaPostAction } from '@/modules/social/actions';
import { getIdeaVaultPosts } from '@/modules/social/queries';

export const dynamic = 'force-dynamic';

export default async function SocialIdeasPage() {
  const ideaPosts = await getIdeaVaultPosts();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Idea Vault"
        subtitle="Capture and shape content concepts before they enter production stages."
      />

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Quick Create Idea</h2>

        <form action={createIdeaPostAction} className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Title</span>
            <input name="title" required />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Type</span>
            <select name="type" defaultValue="USED_BIKE">
              {SOCIAL_POST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="md:col-span-2">
            <legend className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Platforms</legend>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <label key={platform} className="inline-flex items-center gap-2 rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2 text-sm text-[#FAFAFA]">
                  <input type="checkbox" name="platforms" value={platform} className="h-4 w-4" defaultChecked={platform === 'FACEBOOK'} />
                  {platform}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Optional Scheduled Date</span>
            <input type="datetime-local" name="scheduledFor" />
          </label>

          <SubmitButton variant="primary" className="w-fit" pendingText="Creating...">
            Save Idea
          </SubmitButton>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[#FF8124]" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Idea Backlog</h2>
        </div>

        {ideaPosts.length === 0 ? (
          <p className="text-sm text-[#A1A1AA]">No ideas yet. Add your first concept above.</p>
        ) : (
          <ul className="space-y-2">
            {ideaPosts.map((post) => (
              <li key={post.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-4 py-3">
                <p className="text-sm font-semibold text-[#FAFAFA]">{post.title}</p>
                <p className="mt-1 text-xs text-[#A1A1AA]">
                  {post.platforms.join(', ')} • {post.type} • Created {formatDate(post.createdAt)}
                  {post.scheduledFor ? ` • Scheduled ${formatDate(post.scheduledFor)}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
