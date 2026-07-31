import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { Priority, Task } from '../../models/task';
import { ConfirmDialog, ConfirmDialogData } from '../confirm-dialog/confirm-dialog';
import { TaskItem } from '../task-item/task-item';
import { EditTaskDialog } from '../edit-task-dialog/edit-task-dialog';
import {
  filterAndSortTasks,
  SortBy,
  StatusFilter,
} from '../../shared/task-filter';

@Component({
  selector: 'app-task-list',
    imports: [
    TaskItem,
    FormsModule,
    TitleCasePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  private readonly taskService = inject(TaskService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);

  readonly totalCount = this.taskService.totalCount;
  readonly completedCount = this.taskService.completedCount;
  readonly categories = this.categoryService.categories;
  readonly priorities: Priority[] = ['low', 'medium', 'high'];

  // filter/sort/search state — local UI signals
  readonly search = signal('');
  readonly status = signal<StatusFilter>('all');
  readonly categoryFilter = signal<string>('all');
  readonly priorityFilter = signal<'all' | Priority>('all');
  readonly sortBy = signal<SortBy>('created');

  // the derived, visible list — a computed off the raw tasks + filter state
  readonly visibleTasks = computed(() =>
    filterAndSortTasks(this.taskService.allTasks(), {
      search: this.search(),
      status: this.status(),
      category: this.categoryFilter(),
      priority: this.priorityFilter(),
      sortBy: this.sortBy(),
    }),
  );

  toggle(id: string): void {
    this.taskService.toggleComplete(id);
  }

  edit(task: Task): void {
    this.dialog.open(EditTaskDialog, { data: task, width: '480px' });
  }

  confirmDelete(task: Task): void {
    const data: ConfirmDialogData = {
      title: 'Delete task?',
      message: `"${task.title}" will be permanently removed.`,
      confirmText: 'Delete',
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '360px' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.taskService.deleteTask(task.id);
        }
      });
  }
}