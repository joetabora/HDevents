import { Card } from '@/components/ui/card';
import { PlaybookEditor } from '@/components/events/playbook-editor';
import { type EventPlaybook, type EventPlaybookChecklistItem, type EventPlaybookExecutionItem } from '@/modules/events/playbook';

type UserOption = {
  id: string;
  name: string;
  email: string;
};

function StringListPreview({
  title,
  items
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[#A1A1AA]">No items added yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2 text-sm text-[#A1A1AA]">
              {item}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ExecutionPreview({
  title,
  items,
  checklist = false,
  users
}: {
  title: string;
  items: EventPlaybookExecutionItem[] | EventPlaybookChecklistItem[];
  checklist?: boolean;
  users: UserOption[];
}) {
  if (items.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">{title}</h3>
        <p className="mt-3 text-sm text-[#A1A1AA]">No items added yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const owner = users.find((user) => user.id === item.ownerId);
          return (
            <li key={item.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#FAFAFA]">{checklist ? (item as EventPlaybookChecklistItem).item : item.title}</p>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    item.completed ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-[#27272A] text-[#A1A1AA]'
                  }`}
                >
                  {item.completed ? 'DONE' : item.status}
                </span>
              </div>
              {checklist && (item as EventPlaybookChecklistItem).description ? (
                <p className="mt-1 text-xs text-[#A1A1AA]">{(item as EventPlaybookChecklistItem).description}</p>
              ) : null}
              <p className="mt-1 text-xs text-[#A1A1AA]">
                {owner ? `Owner: ${owner.name}` : 'Owner: Unassigned'}
                {item.dueDate ? ` • Due ${item.dueDate}` : ''}
              </p>
              {item.notes ? <p className="mt-1 text-xs text-[#A1A1AA]">{item.notes}</p> : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function PlaybookPanel({
  eventId,
  playbook,
  canEdit,
  users
}: {
  eventId: string;
  playbook: EventPlaybook;
  canEdit: boolean;
  users: UserOption[];
}) {
  const checklistCompletedCount = playbook.checklist.filter((item) => item.completed).length;
  const executionItems = [
    ...playbook.weekFlow.monday,
    ...playbook.weekFlow.tuesday,
    ...playbook.weekFlow.wednesday,
    ...playbook.weekFlow.friday,
    ...playbook.weekFlow.saturday,
    ...playbook.postEventFollowUp.within24Hours,
    ...playbook.postEventFollowUp.within3Days,
    ...playbook.postEventFollowUp.managerMeeting
  ];
  const assignedCount = executionItems.filter((item) => item.ownerId).length;

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
          <p className="text-sm text-[#A1A1AA]">Execution Coverage</p>
          <p className="mt-2 text-lg font-semibold text-[#FAFAFA]">
            {checklistCompletedCount} checklist done · {assignedCount} assigned
          </p>
        </Card>
      </section>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Event Playbook</h2>
            <p className="mt-1 text-xs text-[#A1A1AA]">
              Operational brief with owner-based execution tracking for prep, event week, and follow-up.
            </p>
          </div>
        </div>

        {canEdit ? (
          <PlaybookEditor eventId={eventId} playbook={playbook} users={users} />
        ) : (
          <div className="mt-6 space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Purpose & Goals</h3>
                <p className="mt-3 text-sm text-[#A1A1AA]">{playbook.purpose}</p>
                <ul className="mt-3 space-y-2">
                  {playbook.goals.map((goal, index) => (
                    <li key={`goal-${index}`} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2 text-sm text-[#A1A1AA]">
                      {goal}
                    </li>
                  ))}
                </ul>
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
                    <ul className="space-y-2">
                      {playbook.preEventPreparation.map((item, index) => (
                        <li key={`prep-${index}`} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2 text-sm text-[#A1A1AA]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Marketing Assets</p>
                    <ul className="space-y-2">
                      {playbook.marketingAssets.map((item, index) => (
                        <li key={`asset-${index}`} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2 text-sm text-[#A1A1AA]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Internal Communication</p>
                    <ul className="space-y-2">
                      {playbook.internalCommunication.map((item, index) => (
                        <li key={`internal-${index}`} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2 text-sm text-[#A1A1AA]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              <ExecutionPreview title="Operational Checklist" items={playbook.checklist} checklist users={users} />
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StringListPreview title="Success Metrics" items={playbook.successMetrics} />
              <StringListPreview title="Reusable Assets" items={playbook.reusableAssets} />
              <Card className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Roles & Responsibilities</h3>
                <div className="mt-3 space-y-2 text-sm text-[#A1A1AA]">
                  <p><span className="text-[#FAFAFA]">Marketing Lead:</span> {playbook.rolesAndResponsibilities.marketingLead || 'Unassigned'}</p>
                  <p><span className="text-[#FAFAFA]">Sales Team:</span> {playbook.rolesAndResponsibilities.salesTeam || 'Unassigned'}</p>
                  <p><span className="text-[#FAFAFA]">Service Team:</span> {playbook.rolesAndResponsibilities.serviceTeam || 'Unassigned'}</p>
                  <p><span className="text-[#FAFAFA]">MotorClothes:</span> {playbook.rolesAndResponsibilities.motorClothes || 'Unassigned'}</p>
                  <p><span className="text-[#FAFAFA]">GM / Owner:</span> {playbook.rolesAndResponsibilities.gmOwner || 'Unassigned'}</p>
                  <p>
                    <span className="text-[#FAFAFA]">Volunteers / Charities:</span>{' '}
                    {playbook.rolesAndResponsibilities.volunteersOrCharities || 'Unassigned'}
                  </p>
                </div>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <ExecutionPreview title="Monday" items={playbook.weekFlow.monday} users={users} />
              <ExecutionPreview title="Tuesday" items={playbook.weekFlow.tuesday} users={users} />
              <ExecutionPreview title="Wednesday" items={playbook.weekFlow.wednesday} users={users} />
              <ExecutionPreview title="Friday" items={playbook.weekFlow.friday} users={users} />
              <ExecutionPreview title="Saturday / Event Day" items={playbook.weekFlow.saturday} users={users} />
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
              <ExecutionPreview title="Within 24 Hours" items={playbook.postEventFollowUp.within24Hours} users={users} />
              <ExecutionPreview title="Within 3 Days" items={playbook.postEventFollowUp.within3Days} users={users} />
              <ExecutionPreview title="Manager Meeting" items={playbook.postEventFollowUp.managerMeeting} users={users} />
            </section>
          </div>
        )}
      </Card>
    </div>
  );
}
