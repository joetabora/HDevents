import { SubmitButton } from '@/components/forms/submit-button';
import { Card } from '@/components/ui/card';
import {
  formatChecklistInput,
  formatMultilineList,
  type EventPlaybook,
  type EventPlaybookChecklistItem
} from '@/modules/events/playbook';
import { updateEventPlaybookFormAction } from '@/modules/events/actions';

function SectionList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[#A1A1AA]">No items added yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2 text-sm text-[#A1A1AA]">
          {item}
        </li>
      ))}
    </ul>
  );
}

function ChecklistPreview({ items }: { items: EventPlaybookChecklistItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[#A1A1AA]">No checklist items added yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={`${item.item}-${item.description}`} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2">
          <p className="text-sm font-semibold text-[#FAFAFA]">{item.item}</p>
          {item.description ? <p className="mt-1 text-xs text-[#A1A1AA]">{item.description}</p> : null}
          <p className="mt-1 text-xs text-[#A1A1AA]">{item.notes || 'No execution note yet.'}</p>
        </li>
      ))}
    </ul>
  );
}

export function PlaybookPanel({
  eventId,
  playbook,
  canEdit
}: {
  eventId: string;
  playbook: EventPlaybook;
  canEdit: boolean;
}) {
  const checklistReadyCount = playbook.checklist.filter((item) => item.notes.trim()).length;

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-[#A1A1AA]">Theme</p>
          <p className="mt-2 text-lg font-semibold text-[#FAFAFA]">{playbook.theme || 'Not set'}</p>
        </Card>

        <Card>
          <p className="text-sm text-[#A1A1AA]">Location</p>
          <p className="mt-2 text-lg font-semibold text-[#FAFAFA]">{playbook.location || 'Not set'}</p>
        </Card>

        <Card>
          <p className="text-sm text-[#A1A1AA]">QR Scan Goal</p>
          <p className="mt-2 text-lg font-semibold text-[#FAFAFA]">{playbook.qrScanGoal ?? 'Not set'}</p>
        </Card>

        <Card>
          <p className="text-sm text-[#A1A1AA]">Checklist Progress</p>
          <p className="mt-2 text-lg font-semibold text-[#FAFAFA]">
            {checklistReadyCount} / {playbook.checklist.length}
          </p>
        </Card>
      </section>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Event Playbook</h2>
            <p className="mt-1 text-xs text-[#A1A1AA]">
              Structured operational brief covering planning, execution, follow-up, and reusable event assets.
            </p>
          </div>
        </div>

        {canEdit ? (
          <form action={updateEventPlaybookFormAction} className="mt-6 space-y-8">
            <input type="hidden" name="eventId" value={eventId} />

            <section className="grid gap-4 md:grid-cols-4">
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Purpose</span>
                <textarea name="purpose" rows={4} defaultValue={playbook.purpose} />
              </label>

              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Goals</span>
                <textarea name="goals" rows={4} defaultValue={formatMultilineList(playbook.goals)} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Theme</span>
                <input name="theme" defaultValue={playbook.theme} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Location</span>
                <input name="location" defaultValue={playbook.location} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Start Time</span>
                <input name="startTime" defaultValue={playbook.startTime} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">End Time</span>
                <input name="endTime" defaultValue={playbook.endTime} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">QR Scan Goal</span>
                <input name="qrScanGoal" type="number" min="0" step="1" defaultValue={playbook.qrScanGoal ?? ''} />
              </label>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Food & Refreshments</span>
                <textarea name="coreFoodAndRefreshments" rows={3} defaultValue={playbook.coreActivities.foodAndRefreshments} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Entertainment</span>
                <textarea name="coreEntertainment" rows={3} defaultValue={playbook.coreActivities.entertainment} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Bike Activity</span>
                <textarea name="coreBikeActivity" rows={3} defaultValue={playbook.coreActivities.bikeActivity} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Engagement Opportunity</span>
                <textarea
                  name="coreEngagementOpportunity"
                  rows={3}
                  defaultValue={playbook.coreActivities.engagementOpportunity}
                />
              </label>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Pre-Event Preparation</span>
                <textarea name="preEventPreparation" rows={6} defaultValue={formatMultilineList(playbook.preEventPreparation)} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Marketing Assets</span>
                <textarea name="marketingAssets" rows={6} defaultValue={formatMultilineList(playbook.marketingAssets)} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Internal Communication</span>
                <textarea
                  name="internalCommunication"
                  rows={6}
                  defaultValue={formatMultilineList(playbook.internalCommunication)}
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Layout Plan</span>
                <textarea name="layoutPlan" rows={6} defaultValue={playbook.layoutPlan} />
              </label>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Checklist</span>
                <textarea name="checklist" rows={10} defaultValue={formatChecklistInput(playbook.checklist)} />
                <p className="mt-2 text-xs text-[#A1A1AA]">One line per item. Format: item | description | notes</p>
              </label>

              <div className="space-y-4">
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Monday</span>
                  <textarea name="weekMonday" rows={3} defaultValue={formatMultilineList(playbook.weekFlow.monday)} />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Tuesday</span>
                  <textarea name="weekTuesday" rows={3} defaultValue={formatMultilineList(playbook.weekFlow.tuesday)} />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Wednesday</span>
                  <textarea name="weekWednesday" rows={3} defaultValue={formatMultilineList(playbook.weekFlow.wednesday)} />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Friday</span>
                  <textarea name="weekFriday" rows={4} defaultValue={formatMultilineList(playbook.weekFlow.friday)} />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Saturday / Event Day</span>
                  <textarea name="weekSaturday" rows={4} defaultValue={formatMultilineList(playbook.weekFlow.saturday)} />
                </label>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Within 24 Hours</span>
                <textarea
                  name="followUpWithin24Hours"
                  rows={5}
                  defaultValue={formatMultilineList(playbook.postEventFollowUp.within24Hours)}
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Within 3 Days</span>
                <textarea
                  name="followUpWithin3Days"
                  rows={5}
                  defaultValue={formatMultilineList(playbook.postEventFollowUp.within3Days)}
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Manager Meeting</span>
                <textarea
                  name="followUpManagerMeeting"
                  rows={5}
                  defaultValue={formatMultilineList(playbook.postEventFollowUp.managerMeeting)}
                />
              </label>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Marketing Lead</span>
                <input name="roleMarketingLead" defaultValue={playbook.rolesAndResponsibilities.marketingLead} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Sales Team</span>
                <input name="roleSalesTeam" defaultValue={playbook.rolesAndResponsibilities.salesTeam} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Service Team</span>
                <input name="roleServiceTeam" defaultValue={playbook.rolesAndResponsibilities.serviceTeam} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">MotorClothes</span>
                <input name="roleMotorClothes" defaultValue={playbook.rolesAndResponsibilities.motorClothes} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">GM / Owner</span>
                <input name="roleGmOwner" defaultValue={playbook.rolesAndResponsibilities.gmOwner} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Volunteers / Charities</span>
                <input
                  name="roleVolunteersOrCharities"
                  defaultValue={playbook.rolesAndResponsibilities.volunteersOrCharities}
                />
              </label>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Success Metrics</span>
                <textarea name="successMetrics" rows={6} defaultValue={formatMultilineList(playbook.successMetrics)} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Reusable Assets</span>
                <textarea name="reusableAssets" rows={6} defaultValue={formatMultilineList(playbook.reusableAssets)} />
              </label>
            </section>

            <div className="flex justify-end">
              <SubmitButton variant="primary" pendingText="Saving playbook...">
                Save Playbook
              </SubmitButton>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Purpose & Goals</h3>
                <p className="mt-3 text-sm text-[#A1A1AA]">{playbook.purpose}</p>
                <div className="mt-3">
                  <SectionList items={playbook.goals} />
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Core Activities</h3>
                <div className="mt-3 space-y-2 text-sm text-[#A1A1AA]">
                  <p><span className="text-[#FAFAFA]">Food:</span> {playbook.coreActivities.foodAndRefreshments}</p>
                  <p><span className="text-[#FAFAFA]">Entertainment:</span> {playbook.coreActivities.entertainment}</p>
                  <p><span className="text-[#FAFAFA]">Bike Activity:</span> {playbook.coreActivities.bikeActivity}</p>
                  <p><span className="text-[#FAFAFA]">Engagement:</span> {playbook.coreActivities.engagementOpportunity}</p>
                </div>
              </Card>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Preparation & Marketing</h3>
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Pre-Event Preparation</p>
                    <SectionList items={playbook.preEventPreparation} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Marketing Assets</p>
                    <SectionList items={playbook.marketingAssets} />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Checklist</h3>
                <div className="mt-3">
                  <ChecklistPreview items={playbook.checklist} />
                </div>
              </Card>
            </section>
          </div>
        )}
      </Card>
    </div>
  );
}
