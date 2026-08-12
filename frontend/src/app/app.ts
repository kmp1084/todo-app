import { Component, inject, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TaskForm } from './components/task-form/task-form';
import { TaskList } from './components/task-list/task-list';
import { ManageCategoriesDialog } from './components/manage-categories-dialog/manage-categories-dialog';
import { TaskService } from './services/task.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, TaskForm, TaskList, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly dialog = inject(MatDialog);
  private readonly taskService = inject(TaskService);
  
  protected readonly title = signal('Todos');
  protected readonly error = this.taskService.error;

  manageCategories(): void {
    this.dialog.open(ManageCategoriesDialog, { width: '400px' });
  }

  dismissError(): void {
    this.taskService.clearError();
  }
}