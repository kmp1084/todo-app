import { Component, input, output, signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task';

@Component({
  selector: 'app-task-item',
  imports: [
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './task-item.html',
  styleUrl: './task-item.scss',
})
export class TaskItem {
  readonly task = input.required<Task>();

  readonly toggled = output<void>();
  readonly deleteRequested = output<void>();
  readonly titleChanged = output<string>();

  readonly editing = signal(false);
  readonly draftTitle = signal('');

  startEditing(): void {
    this.draftTitle.set(this.task().title);
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  save(): void {
    if (!this.editing()) {
      return;
    }
    
    const trimmed = this.draftTitle().trim();

    if (trimmed && trimmed !== this.task().title) {
      this.titleChanged.emit(trimmed);
    }

    this.editing.set(false);
  }
}