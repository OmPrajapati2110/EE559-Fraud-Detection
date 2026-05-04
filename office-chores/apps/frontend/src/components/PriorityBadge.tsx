import { cn } from '@/lib/utils';

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        PRIORITY_STYLES[priority] ?? 'bg-gray-100 text-gray-800'
      )}
    >
      {priority}
    </span>
  );
}
