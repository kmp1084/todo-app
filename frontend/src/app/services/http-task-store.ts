import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { NewTask, Task, TaskChanges } from '../models/task';
import { environment } from '../../environments/environment';
import type { TaskStore } from './task-store';

@Service()
export class HttpTaskStore implements TaskStore {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tasks`;

  private readonly tasksSignal = signal<Task[]>([]);
  readonly tasks = this.tasksSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    this.reload();
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  private reload(): void {
    this.run(this.http.get<Task[]>(this.baseUrl), 'Loading tasks',
      (tasks) => this.tasksSignal.set(tasks));
  }

  add(input: NewTask): void {
    this.run(
      this.http.post<Task>(this.baseUrl, { ...input, completed: false }),
      'Creating the task',
      (created) => this.tasksSignal.update((list) => [...list, created]),
    );
  }

  update(id: string, changes: TaskChanges): void {
    const current = this.tasksSignal().find((t) => t.id === id);
    if (current) this.put({ ...current, ...changes });
  }

  toggle(id: string): void {
    const current = this.tasksSignal().find((t) => t.id === id);
    if (current) this.put({ ...current, completed: !current.completed });
  }

  remove(id: string): void {
    this.run(
      this.http.delete<void>(`${this.baseUrl}/${id}`),
      'Deleting the task',
      () => this.tasksSignal.update((list) => list.filter((t) => t.id !== id)),
    );
  }

  reassignCategory(from: string, to: string): void {
    for (const task of this.tasksSignal().filter((t) => t.category === from)) {
      this.put({ ...task, category: to });
    }
  }

  /** PUT is a full replacement, so send the whole merged task. */
  private put(task: Task): void {
    const body = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      completed: task.completed,
    };
    this.run(
      this.http.put<Task>(`${this.baseUrl}/${task.id}`, body),
      'Saving the task',
      (saved) =>
        this.tasksSignal.update((list) => list.map((t) => (t.id === saved.id ? saved : t))),
    );
  }

  /** Subscribe once, clear the error on success, describe it on failure. */
  private run<T>(request: Observable<T>, action: string, onSuccess: (value: T) => void): void {
    request.subscribe({
      next: (value) => {
        this.errorSignal.set(null);
        onSuccess(value);
      },
      error: (err: unknown) => {
        console.error(`${action} failed`, err);
        this.errorSignal.set(this.describe(action, err));
      },
    });
  }

  private describe(action: string, err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return `${action} failed — can't reach the server. Is the backend running?`;
      }
      const problem = err.error as { detail?: string } | null;   // RFC 9457 body
      if (problem?.detail) {
        return `${action} failed — ${problem.detail}`;
      }
      return `${action} failed — HTTP ${err.status}.`;
    }
    return `${action} failed.`;
  }
}