import { Priority, Task } from '../models/task';

export type StatusFilter = 'all' | 'active' | 'completed';
export type SortBy = 'created' | 'due' | 'priority';

export interface TaskFilterOptions {
  search: string;
  status: StatusFilter;
  category: string; // 'all' or a category name
  priority: 'all' | Priority;
  sortBy: SortBy;
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function filterAndSortTasks(tasks: Task[], opts: TaskFilterOptions): Task[] {
  const term = opts.search.trim().toLowerCase();

  const filtered = tasks.filter((t) => {
    if (opts.status === 'active' && t.completed) return false;
    if (opts.status === 'completed' && !t.completed) return false;
    if (opts.category !== 'all' && t.category !== opts.category) return false;
    if (opts.priority !== 'all' && t.priority !== opts.priority) return false;

    if (term) {
      const inTitle = t.title.toLowerCase().includes(term);
      const inDescription = (t.description ?? '').toLowerCase().includes(term);
      if (!inTitle && !inDescription) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (opts.sortBy) {
      case 'due':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      case 'priority':
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      default:
        return a.createdAt.localeCompare(b.createdAt);
    }
  });
}