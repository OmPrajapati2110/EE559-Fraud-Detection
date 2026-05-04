import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PriorityBadge } from '@/components/PriorityBadge';
import type { ChoreHistory } from '@office-chores/shared';

interface HistoryResponse {
  history: (ChoreHistory & { chore: { title: string }; completedBy: { name: string; email: string } })[];
  total: number;
  page: number;
  limit: number;
}

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['history', page, filters],
    queryFn: () =>
      api
        .get<HistoryResponse>('/history', {
          params: { page, limit: 20, ...filters },
        })
        .then((r) => r.data),
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Chore History</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">From</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => { setFilters((f) => ({ ...f, startDate: e.target.value })); setPage(1); }}
            className="border rounded-md px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">To</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => { setFilters((f) => ({ ...f, endDate: e.target.value })); setPage(1); }}
            className="border rounded-md px-3 py-1.5 text-sm"
          />
        </div>
        {(filters.startDate || filters.endDate) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFilters({ startDate: '', endDate: '' }); setPage(1); }}
              className="text-xs text-muted-foreground hover:text-foreground py-1.5"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="border rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Chore</th>
                  <th className="text-left px-4 py-3 font-medium">Assigned to</th>
                  <th className="text-left px-4 py-3 font-medium">Due date</th>
                  <th className="text-left px-4 py-3 font-medium">Completed</th>
                  <th className="text-left px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No completed chores found.
                    </td>
                  </tr>
                )}
                {data?.history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{entry.choreTitle ?? (entry as any).chore?.title}</td>
                    <td className="px-4 py-3">
                      <p>{entry.completedByName ?? (entry as any).completedBy?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(entry.dueDate)}</td>
                    <td className="px-4 py-3 text-green-600">{formatDate(entry.completedAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{entry.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-muted-foreground">
                Showing {data?.history.length} of {data?.total} entries
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
