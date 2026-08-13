import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY, Observable, catchError, concatMap, from, map, of, switchMap, tap, toArray } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from '../components/confirm-dialog/confirm-dialog';
import { environment } from '../../environments/environment';
import { Task } from '../models/task';
import { CategoryService } from './category.service';
import { HttpTaskStore } from './http-task-store';
import { LocalTaskStore } from './local-task-store';

@Service()
export class GuestMigrationService {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly local = inject(LocalTaskStore);
  private readonly remote = inject(HttpTaskStore);
  private readonly categories = inject(CategoryService);
  private readonly baseUrl = `${environment.apiUrl}/tasks`;

  /** Offers to move guest tasks into the signed-in account. Never errors. */
  run(): Observable<void> {
    const guestTasks = this.local.tasks();
    if (guestTasks.length === 0) {
      return of(undefined);                                    // ①
    }

    const count = guestTasks.length;
    const data: ConfirmDialogData = {
      title: 'Add your guest tasks?',
      message: `You have ${count} task${count === 1 ? '' : 's'} created before you signed in. `
             + 'Add them to your account?',
      confirmText: 'Add to my account',
    };

    return this.dialog
      .open(ConfirmDialog, { data, width: '380px' })
      .afterClosed()
      .pipe(switchMap((confirmed) => (confirmed ? this.migrate(guestTasks) : of(undefined))));
  }

  private migrate(tasks: Task[]): Observable<void> {
    this.mergeCategories(tasks);                               // ②

    return from(tasks).pipe(
      concatMap((task) =>                                      // ③ one at a time, in order
        this.http.post<Task>(this.baseUrl, this.toRequest(task)).pipe(
          tap(() => this.local.remove(task.id)),               // ④ only after the server has it
          catchError(() => EMPTY),                             // ⑤ skip this one, keep going
        ),
      ),
      toArray(),
      tap(() => this.remote.reload()),                         // ⑥
      map(() => undefined),
    );
  }

  private mergeCategories(tasks: Task[]): void {
    for (const name of new Set(tasks.map((t) => t.category))) {
      this.categories.addCategory(name);                       // no-op if it already exists
    }
  }

  private toRequest(task: Task) {
    return {
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      completed: task.completed,                               // ⑦
    };
  }
}