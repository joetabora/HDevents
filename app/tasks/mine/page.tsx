import { PageHeader } from '@/components/layout/page-header';
import { TaskCompleteToggle } from '@/components/tasks/task-complete-toggle';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils/format';
import { listTasksForUser } from '@/modules/tasks/services';
import { canEditContent } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';

export const dynamic = 'force-dynamic';

export default async function MyTasksPage() {
  const user = await requireCurrentUserPage();
  const tasks = await listTasksForUser(user.id);
  const allowEdits = canEditContent(user.role);

  return (
    <div className="space-y-10">
      <PageHeader
        title="My Tasks"
        subtitle="Your assigned reminders and execution queue."
      />

      <Card>
        {tasks.length === 0 ? (
          <p className="text-sm text-[#A1A1AA]">No tasks assigned to you.</p>
        ) : (
          <div className="space-y-3">
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
