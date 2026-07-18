import { Service, signal, computed } from '@angular/core';
import { Task } from '../models/task';

@Service()
export class TaskService {
  private readonly tasks = signal<Task[]>([]);

  readonly allTasks = this.tasks.asReadonly();
  readonly totalCount = computed(() => this.tasks().length);
  readonly completedCount = computed(() => this.tasks().filter((t) => t.completed).length);

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
}