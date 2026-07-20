import { Component, inject } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task';
import { ConfirmDialog, ConfirmDialogData } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-task-list',
  imports: [MatCheckboxModule,MatButtonModule, MatIconModule],
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