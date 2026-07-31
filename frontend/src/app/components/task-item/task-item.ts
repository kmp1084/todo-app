import { Component, input, output } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Task } from '../../models/task';

@Component({
  selector: 'app-task-item',
  imports: [MatCheckboxModule, MatButtonModule, MatIconModule, DatePipe, TitleCasePipe],
  templateUrl: './task-item.html',
  styleUrl: './task-item.scss',
})
export class TaskItem {
  readonly task = input.required<Task>();

  readonly toggled = output<void>();
  readonly deleteRequested = output<void>();
  readonly editRequested = output<void>();
}