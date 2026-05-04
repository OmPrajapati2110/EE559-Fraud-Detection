import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PRIORITY_COLORS, formatDate } from '@/lib/utils';
import { PriorityBadge } from '@/components/PriorityBadge';
import { AdminOnly } from '@/components/AdminOnly';
import { CheckCircle, XCircle, X } from 'lucide-react';
import type { ChoreAssignment } from '@office-chores/shared';
import { useAuthStore } from '@/store/authStore';
import { queryClient } from '@/lib/queryClient';

export default function CalendarPage() {
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [selected, setSelected] = useState<ChoreAssignment | null>(null);
  const { isAdmin } = useAuthStore();
  const calendarRef = useRef<FullCalendar>(null);

  const { data } = useQuery({
    queryKey: ['assignments', dateRange],
    queryFn: () =>
      api
        .get<{ assignments: ChoreAssignment[] }>('/assignments', {
          params: dateRange,
        })
        .then((r) => r.data.assignments),
    enabled: !!dateRange,
  });

  const events = (data ?? []).map((a) => ({
    id: a.id,
    title: `${a.isCompleted ? '✓ ' : ''}${a.choreTitle}`,
    start: a.dueDate,
    allDay: true,
    backgroundColor: PRIORITY_COLORS[a.priority],
    borderColor: PRIORITY_COLORS[a.priority],
    textColor: '#fff',
    extendedProps: a,
  }));

  const handleComplete = async (id: string) => {
    await api.post(`/assignments/${id}/complete`);
    setSelected(null);
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
  };

  const handleUncomplete = async (id: string) => {
    await api.post(`/assignments/${id}/uncomplete`);
    setSelected(null);
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Calendar */}
      <div className="flex-1 min-w-0">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          datesSet={(info) =>
            setDateRange({
              start: info.startStr.split('T')[0],
              end: info.endStr.split('T')[0],
            })
          }
          eventClick={(info) => setSelected(info.event.extendedProps as ChoreAssignment)}
          height="100%"
        />
      </div>

      {/* Detail drawer */}
      {selected && (
        <aside className="w-80 shrink-0 border rounded-xl p-4 bg-white shadow-sm overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">Assignment Detail</h2>
            <button onClick={() => setSelected(null)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Chore</p>
              <p className="font-medium">{selected.choreTitle}</p>
            </div>

            {selected.choreDescription && (
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{selected.choreDescription}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground">Priority</p>
              <PriorityBadge priority={selected.priority} />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Assigned to</p>
              <p className="text-sm font-medium">{selected.user.name}</p>
              <p className="text-xs text-muted-foreground">{selected.user.email}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Due date</p>
              <p className="text-sm">{formatDate(selected.dueDate)}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <span
                className={`text-sm font-medium ${selected.isCompleted ? 'text-green-600' : 'text-yellow-600'}`}
              >
                {selected.isCompleted ? '✓ Completed' : 'Pending'}
              </span>
              {selected.completedAt && (
                <p className="text-xs text-muted-foreground">{formatDate(selected.completedAt)}</p>
              )}
            </div>
          </div>

          <AdminOnly>
            <div className="mt-6 space-y-2">
              {!selected.isCompleted ? (
                <button
                  onClick={() => handleComplete(selected.id)}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              ) : (
                <button
                  onClick={() => handleUncomplete(selected.id)}
                  className="w-full flex items-center justify-center gap-2 border border-destructive text-destructive rounded-md py-2 text-sm font-medium hover:bg-destructive/5 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Undo Completion
                </button>
              )}
            </div>
          </AdminOnly>
        </aside>
      )}
    </div>
  );
}
