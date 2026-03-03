import { AlertTriangle, CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { NewTaskButton } from '@/components/tasks/new-task-button';
import { TaskCompleteToggle } from '@/components/tasks/task-complete-toggle';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils/format';
import { listTasks } from '@/modules/tasks/services';
import { canEditContent } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';
import { listUserOptions } from '@/modules/users/services';

export const dynamic = 'force-dynamic';

export default async function TaskCenterPage() {
  const user = await requireCurrentUserPage();
  const [tasks, users] = await Promise.all([listTasks(), listUserOptions()]);
  const allowEdits = canEditContent(user.role);

  const overdue = tasks.filter((task) => task.isOverdue);
  const dueToday = tasks.filter((task) => task.isDueToday);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Global Task Center"
        subtitle="Cross-team follow-ups and execution reminders across events, social, and vendors."
        right={allowEdits ? <NewTaskButton users={users} /> : null}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-[#A1A1AA]">Open Tasks</p>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{tasks.filter((task) => !task.completed).length}</p>
        </Card>

        <Card className={overdue.length > 0 ? 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.18)]' : ''}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Overdue</p>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-rose-300">{overdue.length}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Due Today</p>
            <CalendarClock className="h-4 w-4 text-[#FF8124]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{dueToday.length}</p>
        </Card>

        <Card>
          <p className="text-sm text-[#A1A1AA]">Completed</p>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{tasks.filter((task) => task.completed).length}</p>
        </Card>
      </section>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Task List</h2>

        {tasks.length === 0 ? (
          <p className="mt-3 text-sm text-[#A1A1AA]">No tasks yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {tasks.map((task) => (
              <article
                key={task.id}
                className={`rounded-2xl border bg-[#111113] p-4 ${
                  task.isOverdue && !task.completed
                    ? 'border-[#FF8124]/60 shadow-[0_0_16px_rgba(255,129,36,0.22)]'
                    : 'border-[#27272A]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm font-semibold ${task.completed ? 'text-[#A1A1AA] line-through' : 'text-[#FAFAFA]'}`}>
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-[#A1A1AA]">
                      {task.relatedType}
                      {task.dueDate ? ` • Due ${formatDate(task.dueDate)}` : ' • No due date'}
                      {task.assignedTo ? ` • Assigned ${task.assignedTo.name}` : ' • Unassigned'}
                    </p>
                  </div>
                  <TaskCompleteToggle taskId={task.id} completed={task.completed} disabled={!allowEdits} />
                </div>

                {task.description ? <p className="mt-2 text-sm text-[#A1A1AA]">{task.description}</p> : null}
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
