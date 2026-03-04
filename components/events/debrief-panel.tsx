'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { editAIDebriefAction, generateAIDebriefAction } from '@/modules/events/debrief-actions';

type DebriefRecord = {
  id: string;
  version: number;
  generatedAt: string;
  content: string;
  generatedBy: { id: string; name: string; email: string } | null;
};

export function DebriefPanel({
  eventId,
  canGenerate,
  latestDebrief,
  history,
  intelligence
}: {
  eventId: string;
  canGenerate: boolean;
  latestDebrief: DebriefRecord | null;
  history: DebriefRecord[];
  intelligence: {
    estimatedBudget: number;
    actualBudget: number;
    budgetVariance: number;
    attendance: number;
    taskCompletionRate: number;
    engagementScore: number;
    topPostTitle: string | null;
  };
}) {
  const [content, setContent] = useState(latestDebrief?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  async function handleGenerate(mode: 'GENERATE' | 'REGENERATE') {
    setGenerating(true);
    const formData = new FormData();
    formData.set('eventId', eventId);
    formData.set('mode', mode);

    const result = await generateAIDebriefAction(formData);
    setGenerating(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  async function handleSave() {
    if (!latestDebrief) {
      toast.error('Generate a debrief first');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.set('eventId', eventId);
    formData.set('debriefId', latestDebrief.id);
    formData.set('content', content);

    const result = await editAIDebriefAction(formData);
    setSaving(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Intelligence Snapshot</h2>
        <div className="mt-3 grid gap-2 text-sm text-[#A1A1AA] md:grid-cols-2">
          <p>Estimated Budget: ${intelligence.estimatedBudget.toFixed(2)}</p>
          <p>Actual Budget: ${intelligence.actualBudget.toFixed(2)}</p>
          <p>Variance: ${intelligence.budgetVariance.toFixed(2)}</p>
          <p>Attendance: {intelligence.attendance}</p>
          <p>Task Completion: {Math.round(intelligence.taskCompletionRate)}%</p>
          <p>Engagement Score: {intelligence.engagementScore}</p>
          <p className="md:col-span-2">Top Post: {intelligence.topPostTitle ?? 'N/A'}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Debrief & Intelligence</h2>
          {canGenerate ? (
            <div className="flex items-center gap-2">
              {!latestDebrief ? (
                <Button type="button" variant="primary" loading={generating} onClick={() => void handleGenerate('GENERATE')}>
                  Generate AI Debrief
                </Button>
              ) : (
                <Button type="button" variant="secondary" loading={generating} onClick={() => void handleGenerate('REGENERATE')}>
                  Regenerate AI Debrief
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {!latestDebrief ? (
          <p className="mt-3 text-sm text-[#A1A1AA]">No debrief generated yet.</p>
        ) : (
          <>
            <p className="mt-2 text-xs text-[#A1A1AA]">
              Latest: v{latestDebrief.version} by {latestDebrief.generatedBy?.name ?? 'Unknown'}
            </p>
            <textarea
              className="mt-3 min-h-[320px] w-full"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Debrief content..."
            />
            {canGenerate ? (
              <div className="mt-3 flex justify-end">
                <Button type="button" variant="primary" loading={saving} onClick={() => void handleSave()}>
                  Save Debrief Edits
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {history.length > 0 ? (
        <div className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Debrief Versions</h3>
          <ul className="mt-3 space-y-2">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-[#27272A] bg-[#0f0f11] px-3 py-2 text-xs text-[#A1A1AA]">
                Version {entry.version} - {new Date(entry.generatedAt).toLocaleString()} - {entry.generatedBy?.name ?? 'Unknown'}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
