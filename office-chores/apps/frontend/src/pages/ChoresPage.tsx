import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { createChoreSchema } from '@office-chores/shared';
import type { Chore, CreateChoreRequest } from '@office-chores/shared';
import { PriorityBadge } from '@/components/PriorityBadge';
import { DAY_OF_WEEK_LABELS, PRIORITY_LABELS } from '@/lib/utils';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const DAYS = [0, 1, 2, 3, 4, 5, 6];

function ChoreFormModal({
  chore,
  onClose,
}: {
  chore?: Chore;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<string[]>([]);
  const isEdit = !!chore;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateChoreRequest>({
    resolver: zodResolver(createChoreSchema),
    defaultValues: chore
      ? {
          title: chore.title,
          description: chore.description ?? '',
          priority: chore.priority,
          recurrenceRule: chore.recurrenceRule
            ? {
                intervalWeeks: chore.recurrenceRule.intervalWeeks,
                dayOfWeek: chore.recurrenceRule.dayOfWeek,
                startDate: chore.recurrenceRule.startDate.split('T')[0],
              }
            : undefined,
        }
      : { priority: 'MEDIUM', recurrenceRule: { intervalWeeks: 2, dayOfWeek: 1, startDate: '' } },
  });

  const onSubmit = async (data: CreateChoreRequest) => {
    if (isEdit) {
      await api.put(`/chores/${chore.id}`, data);
    } else {
      await api.post('/chores', data);
    }
    queryClient.invalidateQueries({ queryKey: ['chores'] });
    onClose();
  };

  const choreId = chore?.id;
  const handlePreview = async () => {
    if (!choreId) return;
    const res = await api.post<{ occurrences: string[] }>(`/chores/${choreId}/preview`);
    setPreview(res.data.occurrences);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{isEdit ? 'Edit Chore' : 'New Chore'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              {...register('title')}
              className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              placeholder="e.g. Clean Kitchen"
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              placeholder="Details about this chore…"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Priority *</label>
            <select {...register('priority')} className="w-full border rounded-md px-3 py-2 text-sm mt-1">
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>

          <fieldset className="border rounded-lg p-4 space-y-3">
            <legend className="text-sm font-medium px-1">Recurrence Rule</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Every N weeks</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  {...register('recurrenceRule.intervalWeeks', { valueAsNumber: true })}
                  className="w-full border rounded-md px-3 py-1.5 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Day of week</label>
                <select
                  {...register('recurrenceRule.dayOfWeek', { valueAsNumber: true })}
                  className="w-full border rounded-md px-3 py-1.5 text-sm mt-1"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{DAY_OF_WEEK_LABELS[d]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Start date *</label>
              <input
                type="date"
                {...register('recurrenceRule.startDate')}
                className="w-full border rounded-md px-3 py-1.5 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">End date (optional)</label>
              <input
                type="date"
                {...register('recurrenceRule.endDate')}
                className="w-full border rounded-md px-3 py-1.5 text-sm mt-1"
              />
            </div>

            {isEdit && (
              <div>
                <button
                  type="button"
                  onClick={handlePreview}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Eye className="w-3 h-3" /> Preview next occurrences
                </button>
                {preview.length > 0 && (
                  <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
                    {preview.map((d) => <li key={d}>• {d}</li>)}
                  </ul>
                )}
              </div>
            )}
          </fieldset>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-md hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChoresPage() {
  const [showModal, setShowModal] = useState(false);
  const [editChore, setEditChore] = useState<Chore | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['chores'],
    queryFn: () => api.get<{ chores: Chore[] }>('/chores').then((r) => r.data.chores),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/chores/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chores'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chores</h1>
        <button
          onClick={() => { setEditChore(undefined); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> New Chore
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Priority</th>
                <th className="text-left px-4 py-3 font-medium">Recurrence</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.map((chore) => (
                <tr key={chore.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium">{chore.title}</p>
                    {chore.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{chore.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={chore.priority} /></td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {chore.recurrenceRule
                      ? `Every ${chore.recurrenceRule.intervalWeeks}w on ${DAY_OF_WEEK_LABELS[chore.recurrenceRule.dayOfWeek]}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setEditChore(chore); setShowModal(true); }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${chore.title}"?`)) deleteMutation.mutate(chore.id);
                        }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ChoreFormModal chore={editChore} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
