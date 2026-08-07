import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { NewTask, Task, TaskChanges } from '../models/task';
import { environment } from '../../environments/environment';
import type { TaskStore } from './task-store';

@Service()
export class HttpTaskStore implements TaskStore {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tasks`;

  private readonly tasksSignal = signal<Task[]>([]);
  readonly tasks = this.tasksSignal.asReadonly();

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.http.get<Task[]>(this.baseUrl).subscribe({
      next: (tasks) => this.tasksSignal.set(tasks),
      error: (err) => console.error('Failed to load tasks', err),
    });
  }

  add(input: NewTask): void {
    this.http.post<Task>(this.baseUrl, { ...input, completed: false }).subscribe({
      next: (created) => this.tasksSignal.update((list) => [...list, created]),
      error: (err) => console.error('Failed to create task', err),
    });
  }

  update(id: string, changes: TaskChanges): void {
    const current = this.tasksSignal().find((t) => t.id === id);
    if (!current) return;
    this.put({ ...current, ...changes });
  }

  toggle(id: string): void {
    const current = this.tasksSignal().find((t) => t.id === id);
    if (!current) return;
    this.put({ ...current, completed: !current.completed });
  }

  remove(id: string): void {
    this.http.delete<void>(`${this.baseUrl}/${id}`).subscribe({
      next: () => this.tasksSignal.update((list) => list.filter((t) => t.id !== id)),
      error: (err) => console.error('Failed to delete task', err),
    });
  }

  reassignCategory(from: string, to: string): void {
    for (const task of this.tasksSignal().filter((t) => t.category === from)) {
      this.put({ ...task, category: to });
    }
  }

  /** PUT is a FULL replacement, so send the whole merged task. */
  private put(task: Task): void {
    const body = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      completed: task.completed,
    };
    this.http.put<Task>(`${this.baseUrl}/${task.id}`, body).subscribe({
      next: (saved) =>
        this.tasksSignal.update((list) => list.map((t) => (t.id === saved.id ? saved : t))),
      error: (err) => console.error('Failed to update task', err),
    });
  }
}