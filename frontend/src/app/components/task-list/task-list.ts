import { Component, inject } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-list',
  imports: [MatCheckboxModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  private readonly taskService = inject(TaskService);

  readonly tasks = this.taskService.allTasks;
  readonly totalCount = this.taskService.totalCount;
  readonly completedCount = this.taskService.completedCount;

  toggle(id: string): void {
    this.taskService.toggleComplete(id);
  }
}