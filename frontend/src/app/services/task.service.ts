import { Service, signal, computed, effect } from '@angular/core';
import { Task } from '../models/task';

export const STORAGE_KEY = 'todos.tasks';

@Service()
export class TaskService {
  private readonly tasks = signal<Task[]>(this.loadFromStorage());

  readonly allTasks = this.tasks.asReadonly();
  readonly totalCount = computed(() => this.tasks().length);
  readonly completedCount = computed(() => this.tasks().filter((t) => t.completed).length);

 constructor() {
    // Save to localStorage whenever the task list changes.
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks()));
    });
  }

  addTask(input: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>): void {
    const now = new Date().toISOString();
    const task: Task = {
      ...input,
      id: crypto.randomUUID(),
      title: input.title.trim(),
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.update((list) => [...list, task]);
  }

  updateTask(id: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>): void {
    this.tasks.update((list) =>
      list.map((t) =>
        t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
      )
    );
  }

  countByCategory(category: string): number {
    return this.tasks().filter((t) => t.category === category).length;
  }

  reassignCategory(from: string, to: string): void {
    this.tasks.update((list) =>
      list.map((t) => (t.category === from ? { ...t, category: to } : t)),
    );
  }

  deleteTask(id: string): void {
    this.tasks.update((list) => list.filter((t) => t.id !== id));
  }

  toggleComplete(id: string): void {
    this.tasks.update((list) =>
      list.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }

  private loadFromStorage(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Task[]) : [];
    } catch {
      return [];
    }
  }
}