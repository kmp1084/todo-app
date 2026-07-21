import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task';
import { ConfirmDialog, ConfirmDialogData } from '../confirm-dialog/confirm-dialog';
import { TaskItem } from '../task-item/task-item';

@Component({
  selector: 'app-task-list',
  imports: [TaskItem],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  private readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);

  readonly tasks = this.taskService.allTasks;
  readonly totalCount = this.taskService.totalCount;
  readonly completedCount = this.taskService.completedCount;

  toggle(id: string): void {
    this.taskService.toggleComplete(id);
  }

  rename(id: string, title: string): void {
    this.taskService.updateTask(id, { title });
  }

  confirmDelete(task: Task): void {
    const data: ConfirmDialogData = {
      title: 'Delete task?',
      message: `"${task.title}" will be permanently removed.`,
      confirmText: 'Delete',
    };

    const dialogRef = this.dialog.open(ConfirmDialog, { data, width: '360px' });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.taskService.deleteTask(task.id);
      }
    });
  }
}