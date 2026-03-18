'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/forms/submit-button';
import {
  PLAYBOOK_EXECUTION_STATUSES,
  type EventPlaybook,
  type EventPlaybookChecklistItem,
  type EventPlaybookExecutionItem
} from '@/modules/events/playbook';
import { updateEventPlaybookFormAction } from '@/modules/events/actions';

type UserOption = {
  id: string;
  name: string;
  email: string;
};

function createClientExecutionItem(title = ''): EventPlaybookExecutionItem {
  return {
    id: `row-${Math.random().toString(36).slice(2, 10)}`,
    title,
    ownerId: '',
    dueDate: '',
    status: 'NOT_STARTED',
    completed: false,
    notes: ''
  };
}

function createClientChecklistItem(item = ''): EventPlaybookChecklistItem {
  return {
    ...createClientExecutionItem(item),
    item,
    description: ''
  };
}

function ExecutionRows({
  title,
  items,
  users,
  onAdd,
  onUpdate,
  onRemove,
  checklist = false
}: {
  title: string;
  items: EventPlaybookExecutionItem[] | EventPlaybookChecklistItem[];
  users: UserOption[];
  onAdd: () => void;
  onUpdate: (index: number, item: EventPlaybookExecutionItem | EventPlaybookChecklistItem) => void;
  onRemove: (index: number) => void;
  checklist?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-[#27272A] bg-[#111113] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">{title}</h3>
        <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add Row
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[#A1A1AA]">No items added yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const next = item;

            return (
              <div key={item.id} className="grid gap-3 rounded-2xl border border-[#27272A] bg-[#18181B] p-3 md:grid-cols-6">
                <label className={checklist ? 'md:col-span-2' : 'md:col-span-3'}>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">
                    {checklist ? 'Item' : 'Action'}
                  </span>
                  <input
                    value={checklist ? (next as EventPlaybookChecklistItem).item : next.title}
                    onChange={(event) => {
                      if (checklist) {
                        onUpdate(index, {
                          ...(next as EventPlaybookChecklistItem),
                          item: event.target.value,
                          title: event.target.value
                        });
                        return;
                      }

                      onUpdate(index, {
                        ...next,
                        title: event.target.value
                      });
                    }}
                  />
                </label>

                {checklist ? (
                  <label className="md:col-span-2">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Description</span>
                    <input
                      value={(next as EventPlaybookChecklistItem).description}
                      onChange={(event) =>
                        onUpdate(index, {
                          ...(next as EventPlaybookChecklistItem),
                          description: event.target.value
                        })
                      }
                    />
                  </label>
                ) : null}

                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Owner</span>
                  <select
                    value={next.ownerId}
                    onChange={(event) =>
                      onUpdate(index, {
                        ...next,
                        ownerId: event.target.value
                      })
                    }
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Due Date</span>
                  <input
                    type="date"
                    value={next.dueDate}
                    onChange={(event) =>
                      onUpdate(index, {
                        ...next,
                        dueDate: event.target.value
                      })
                    }
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Status</span>
                  <select
                    value={next.status}
                    onChange={(event) =>
                      onUpdate(index, {
                        ...next,
                        status: event.target.value as EventPlaybookExecutionItem['status']
                      })
                    }
                  >
                    {PLAYBOOK_EXECUTION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-end">
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2 text-sm text-[#FAFAFA]">
                    <input
                      type="checkbox"
                      checked={next.completed}
                      onChange={(event) =>
                        onUpdate(index, {
                          ...next,
                          completed: event.target.checked,
                          status: event.target.checked ? 'DONE' : next.status === 'DONE' ? 'NOT_STARTED' : next.status
                        })
                      }
                    />
                    Done
                  </span>
                </label>

                <label className="md:col-span-5">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Notes</span>
                  <input
                    value={next.notes}
                    onChange={(event) =>
                      onUpdate(index, {
                        ...next,
                        notes: event.target.value
                      })
                    }
                  />
                </label>

                <div className="flex items-end justify-end">
                  <Button type="button" variant="danger" className="px-3 py-1.5" onClick={() => onRemove(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PlaybookEditor({
  eventId,
  playbook,
  users
}: {
  eventId: string;
  playbook: EventPlaybook;
  users: UserOption[];
}) {
  const [checklist, setChecklist] = useState(playbook.checklist);
  const [weekMonday, setWeekMonday] = useState(playbook.weekFlow.monday);
  const [weekTuesday, setWeekTuesday] = useState(playbook.weekFlow.tuesday);
  const [weekWednesday, setWeekWednesday] = useState(playbook.weekFlow.wednesday);
  const [weekFriday, setWeekFriday] = useState(playbook.weekFlow.friday);
  const [weekSaturday, setWeekSaturday] = useState(playbook.weekFlow.saturday);
  const [followUpWithin24Hours, setFollowUpWithin24Hours] = useState(playbook.postEventFollowUp.within24Hours);
  const [followUpWithin3Days, setFollowUpWithin3Days] = useState(playbook.postEventFollowUp.within3Days);
  const [followUpManagerMeeting, setFollowUpManagerMeeting] = useState(playbook.postEventFollowUp.managerMeeting);

  function updateExecutionList<T extends EventPlaybookExecutionItem>(items: T[], index: number, nextItem: T) {
    return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
  }

  return (
    <form action={updateEventPlaybookFormAction} className="mt-6 space-y-8">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="checklistJson" value={JSON.stringify(checklist)} />
      <input type="hidden" name="weekMondayJson" value={JSON.stringify(weekMonday)} />
      <input type="hidden" name="weekTuesdayJson" value={JSON.stringify(weekTuesday)} />
      <input type="hidden" name="weekWednesdayJson" value={JSON.stringify(weekWednesday)} />
      <input type="hidden" name="weekFridayJson" value={JSON.stringify(weekFriday)} />
      <input type="hidden" name="weekSaturdayJson" value={JSON.stringify(weekSaturday)} />
      <input type="hidden" name="followUpWithin24HoursJson" value={JSON.stringify(followUpWithin24Hours)} />
      <input type="hidden" name="followUpWithin3DaysJson" value={JSON.stringify(followUpWithin3Days)} />
      <input type="hidden" name="followUpManagerMeetingJson" value={JSON.stringify(followUpManagerMeeting)} />

      <section className="grid gap-4 md:grid-cols-4">
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Purpose</span>
          <textarea name="purpose" rows={4} defaultValue={playbook.purpose} />
        </label>

        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Goals</span>
          <textarea name="goals" rows={4} defaultValue={playbook.goals.join('\n')} />
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
          <textarea name="coreEngagementOpportunity" rows={3} defaultValue={playbook.coreActivities.engagementOpportunity} />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Pre-Event Preparation</span>
          <textarea name="preEventPreparation" rows={6} defaultValue={playbook.preEventPreparation.join('\n')} />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Marketing Assets</span>
          <textarea name="marketingAssets" rows={6} defaultValue={playbook.marketingAssets.join('\n')} />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Internal Communication</span>
          <textarea name="internalCommunication" rows={6} defaultValue={playbook.internalCommunication.join('\n')} />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Layout Plan</span>
          <textarea name="layoutPlan" rows={6} defaultValue={playbook.layoutPlan} />
        </label>
      </section>

      <ExecutionRows
        title="Operational Checklist"
        items={checklist}
        users={users}
        checklist
        onAdd={() => setChecklist((prev) => [...prev, createClientChecklistItem()])}
        onUpdate={(index, item) => setChecklist((prev) => updateExecutionList(prev, index, item as EventPlaybookChecklistItem))}
        onRemove={(index) => setChecklist((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <ExecutionRows
          title="Monday"
          items={weekMonday}
          users={users}
          onAdd={() => setWeekMonday((prev) => [...prev, createClientExecutionItem()])}
          onUpdate={(index, item) => setWeekMonday((prev) => updateExecutionList(prev, index, item as EventPlaybookExecutionItem))}
          onRemove={(index) => setWeekMonday((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
        />
        <ExecutionRows
          title="Tuesday"
          items={weekTuesday}
          users={users}
          onAdd={() => setWeekTuesday((prev) => [...prev, createClientExecutionItem()])}
          onUpdate={(index, item) => setWeekTuesday((prev) => updateExecutionList(prev, index, item as EventPlaybookExecutionItem))}
          onRemove={(index) => setWeekTuesday((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
        />
        <ExecutionRows
          title="Wednesday"
          items={weekWednesday}
          users={users}
          onAdd={() => setWeekWednesday((prev) => [...prev, createClientExecutionItem()])}
          onUpdate={(index, item) => setWeekWednesday((prev) => updateExecutionList(prev, index, item as EventPlaybookExecutionItem))}
          onRemove={(index) => setWeekWednesday((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
        />
        <ExecutionRows
          title="Friday"
          items={weekFriday}
          users={users}
          onAdd={() => setWeekFriday((prev) => [...prev, createClientExecutionItem()])}
          onUpdate={(index, item) => setWeekFriday((prev) => updateExecutionList(prev, index, item as EventPlaybookExecutionItem))}
          onRemove={(index) => setWeekFriday((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
        />
        <ExecutionRows
          title="Saturday / Event Day"
          items={weekSaturday}
          users={users}
          onAdd={() => setWeekSaturday((prev) => [...prev, createClientExecutionItem()])}
          onUpdate={(index, item) => setWeekSaturday((prev) => updateExecutionList(prev, index, item as EventPlaybookExecutionItem))}
          onRemove={(index) => setWeekSaturday((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ExecutionRows
          title="Within 24 Hours"
          items={followUpWithin24Hours}
          users={users}
          onAdd={() => setFollowUpWithin24Hours((prev) => [...prev, createClientExecutionItem()])}
          onUpdate={(index, item) =>
            setFollowUpWithin24Hours((prev) => updateExecutionList(prev, index, item as EventPlaybookExecutionItem))
          }
          onRemove={(index) => setFollowUpWithin24Hours((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
        />
        <ExecutionRows
          title="Within 3 Days"
          items={followUpWithin3Days}
          users={users}
          onAdd={() => setFollowUpWithin3Days((prev) => [...prev, createClientExecutionItem()])}
          onUpdate={(index, item) =>
            setFollowUpWithin3Days((prev) => updateExecutionList(prev, index, item as EventPlaybookExecutionItem))
          }
          onRemove={(index) => setFollowUpWithin3Days((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
        />
        <ExecutionRows
          title="Manager Meeting"
          items={followUpManagerMeeting}
          users={users}
          onAdd={() => setFollowUpManagerMeeting((prev) => [...prev, createClientExecutionItem()])}
          onUpdate={(index, item) =>
            setFollowUpManagerMeeting((prev) => updateExecutionList(prev, index, item as EventPlaybookExecutionItem))
          }
          onRemove={(index) => setFollowUpManagerMeeting((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
        />
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
          <input name="roleVolunteersOrCharities" defaultValue={playbook.rolesAndResponsibilities.volunteersOrCharities} />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Success Metrics</span>
          <textarea name="successMetrics" rows={6} defaultValue={playbook.successMetrics.join('\n')} />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Reusable Assets</span>
          <textarea name="reusableAssets" rows={6} defaultValue={playbook.reusableAssets.join('\n')} />
        </label>
      </section>

      <div className="flex justify-end">
        <SubmitButton variant="primary" pendingText="Saving playbook...">
          Save Playbook
        </SubmitButton>
      </div>
    </form>
  );
}
