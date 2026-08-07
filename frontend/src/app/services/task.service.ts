import { Service, computed, inject } from '@angular/core';
import { NewTask, TaskChanges } from '../models/task';
import { TASK_STORE } from './task-store';

@Service()
export class TaskService {
  private readonly store = inject(TASK_STORE);

  readonly allTasks = this.store.tasks;
  readonly totalCount = computed(() => this.allTasks().length);
  readonly completedCount = computed(() => this.allTasks().filter((t) => t.completed).length);

  addTask(input: NewTask): void {
    this.store.add(input);
  }

  updateTask(id: string, changes: TaskChanges): void {
    this.store.update(id, changes);
  }

  deleteTask(id: string): void {
    this.store.remove(id);
  }

  toggleComplete(id: string): void {
    this.store.toggle(id);
  }

  countByCategory(category: string): number {
    return this.allTasks().filter((t) => t.category === category).length;
  }

  reassignCategory(from: string, to: string): void {
    this.store.reassignCategory(from, to);
  }
}