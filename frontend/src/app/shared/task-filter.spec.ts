import { filterAndSortTasks, TaskFilterOptions } from './task-filter';
import { Task } from '../models/task';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    title: overrides.title ?? 'Task',
    completed: overrides.completed ?? false,
    priority: overrides.priority ?? 'medium',
    category: overrides.category ?? 'Work',
    dueDate: overrides.dueDate,
    description: overrides.description,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
  };
}

const baseOpts: TaskFilterOptions = {
  search: '',
  status: 'all',
  category: 'all',
  priority: 'all',
  sortBy: 'created',
};

describe('filterAndSortTasks', () => {
  it('filters by status (active / completed)', () => {
    const tasks = [
      makeTask({ title: 'Done', completed: true }),
      makeTask({ title: 'Todo', completed: false }),
    ];

    expect(filterAndSortTasks(tasks, { ...baseOpts, status: 'active' }).map((t) => t.title))
      .toEqual(['Todo']);
    expect(filterAndSortTasks(tasks, { ...baseOpts, status: 'completed' }).map((t) => t.title))
      .toEqual(['Done']);
  });

  it('filters by category and priority', () => {
    const tasks = [
      makeTask({ title: 'A', category: 'Work', priority: 'high' }),
      makeTask({ title: 'B', category: 'Home', priority: 'low' }),
    ];

    expect(filterAndSortTasks(tasks, { ...baseOpts, category: 'Work' }).map((t) => t.title))
      .toEqual(['A']);
    expect(filterAndSortTasks(tasks, { ...baseOpts, priority: 'low' }).map((t) => t.title))
      .toEqual(['B']);
  });

  it('searches title and description, case-insensitively', () => {
    const tasks = [
      makeTask({ title: 'Buy MILK' }),
      makeTask({ title: 'Walk dog', description: 'bring the milk carton' }),
      makeTask({ title: 'Read book' }),
    ];

    const result = filterAndSortTasks(tasks, { ...baseOpts, search: 'milk' });
    expect(result.map((t) => t.title)).toEqual(['Buy MILK', 'Walk dog']);
  });

  it('combines filters with AND', () => {
    const tasks = [
      makeTask({ title: 'A', category: 'Work', completed: false }),
      makeTask({ title: 'B', category: 'Work', completed: true }),
      makeTask({ title: 'C', category: 'Home', completed: false }),
    ];

    const result = filterAndSortTasks(tasks, { ...baseOpts, category: 'Work', status: 'active' });
    expect(result.map((t) => t.title)).toEqual(['A']);
  });

  it('sorts by priority (high first)', () => {
    const tasks = [
      makeTask({ title: 'low', priority: 'low' }),
      makeTask({ title: 'high', priority: 'high' }),
      makeTask({ title: 'medium', priority: 'medium' }),
    ];

    expect(filterAndSortTasks(tasks, { ...baseOpts, sortBy: 'priority' }).map((t) => t.title))
      .toEqual(['high', 'medium', 'low']);
  });

  it('sorts by due date with undated tasks last', () => {
    const tasks = [
      makeTask({ title: 'no date' }),
      makeTask({ title: 'later', dueDate: '2026-12-01T00:00:00.000Z' }),
      makeTask({ title: 'sooner', dueDate: '2026-06-01T00:00:00.000Z' }),
    ];

    expect(filterAndSortTasks(tasks, { ...baseOpts, sortBy: 'due' }).map((t) => t.title))
      .toEqual(['sooner', 'later', 'no date']);
  });

  it('does not mutate the input array', () => {
    const tasks = [
      makeTask({ title: 'B', priority: 'low' }),
      makeTask({ title: 'A', priority: 'high' }),
    ];
    const original = [...tasks];

    filterAndSortTasks(tasks, { ...baseOpts, sortBy: 'priority' });

    expect(tasks).toEqual(original); // unchanged
  });
});