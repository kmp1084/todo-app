import { Service, computed, inject } from '@angular/core';
import { NewTask, TaskChanges } from '../models/task';
import { AuthService } from './auth.service';
import { HttpTaskStore } from './http-task-store';
import { LocalTaskStore } from './local-task-store';
import type { TaskStore } from './task-store';

@Service()
export class RoutingTaskStore implements TaskStore {
  private readonly local = inject(LocalTaskStore);
  private readonly remote = inject(HttpTaskStore);
  private readonly auth = inject(AuthService);

  /** Guests read and write localStorage; signed-in users read and write the API. */
  private readonly active = computed<TaskStore>(() =>
    this.auth.isLoggedIn() ? this.remote : this.local,
  );

  readonly tasks = computed(() => this.active().tasks());
  readonly error = computed(() => this.active().error());

  add(input: NewTask): void { this.active().add(input); }
  update(id: string, changes: TaskChanges): void { this.active().update(id, changes); }
  remove(id: string): void { this.active().remove(id); }
  toggle(id: string): void { this.active().toggle(id); }
  reassignCategory(from: string, to: string): void { this.active().reassignCategory(from, to); }
  clearError(): void { this.active().clearError(); }
}