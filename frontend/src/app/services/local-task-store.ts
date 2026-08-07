import { Service, effect, signal } from '@angular/core';
import { NewTask, Task, TaskChanges } from '../models/task';
import type { TaskStore } from './task-store'; // ← type-only import
export const STORAGE_KEY = 'todos.tasks';

@Service()
export class LocalTaskStore implements TaskStore {
  private readonly tasksSignal = signal<Task[]>(this.loadFromStorage());
  readonly tasks = this.tasksSignal.asReadonly();
  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    effect(() => {
      const snapshot = JSON.stringify(this.tasksSignal());
      try {
        localStorage.setItem(STORAGE_KEY, snapshot);
      } catch (err) {
        console.error('Failed to save tasks', err);
        this.errorSignal.set('Could not save locally — storage may be full or blocked.');
      }
    });
  }

  add(input: NewTask): void {
    const now = new Date().toISOString();
    const task: Task = {
      ...input,
      id: crypto.randomUUID(),
      title: input.title.trim(),
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    this.tasksSignal.update((list) => [...list, task]);
  }

  update(id: string, changes: TaskChanges): void {
    this.tasksSignal.update((list) =>
      list.map((t) =>
        t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
      )
    );
  }

  remove(id: string): void {
    this.tasksSignal.update((list) => list.filter((t) => t.id !== id));
  }

  toggle(id: string): void {
    this.tasksSignal.update((list) =>
      list.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }

  reassignCategory(from: string, to: string): void {
    this.tasksSignal.update((list) =>
      list.map((t) => (t.category === from ? { ...t, category: to } : t))
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

  clearError(): void {
    this.errorSignal.set(null);
  }
}