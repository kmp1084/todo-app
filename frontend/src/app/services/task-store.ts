import { InjectionToken, Signal, inject } from '@angular/core';
import { NewTask, Task, TaskChanges } from '../models/task';
import { LocalTaskStore } from './local-task-store';

export interface TaskStore {
  readonly tasks: Signal<Task[]>;
  add(input: NewTask): void;
  update(id: string, changes: TaskChanges): void;
  remove(id: string): void;
  toggle(id: string): void;
  reassignCategory(from: string, to: string): void;
}

export const TASK_STORE = new InjectionToken<TaskStore>('TASK_STORE', {
  providedIn: 'root',
  factory: () => inject(LocalTaskStore),   // default until 9b
});