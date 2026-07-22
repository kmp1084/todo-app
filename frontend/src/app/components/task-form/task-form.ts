import { Component, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TaskService } from '../../services/task.service';
import { DEFAULT_CATEGORIES, Priority } from '../../models/task';
import { SubmittedErrorStateMatcher } from '../../shared/submitted-error-state-matcher';

@Component({
  selector: 'app-task-form',
  imports: [
    ReactiveFormsModule,
    TitleCasePipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskForm {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);

  readonly priorities: Priority[] = ['low', 'medium', 'high'];
  readonly categories = DEFAULT_CATEGORIES;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    priority: ['medium' as Priority],
    category: [DEFAULT_CATEGORIES[0]],
    dueDate: this.fb.control<Date | null>(null),
  });

  readonly errorMatcher = new SubmittedErrorStateMatcher();

  submit(formDir: FormGroupDirective): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, priority, category, dueDate } = this.form.getRawValue();

    this.taskService.addTask({
      title,
      description: description.trim() || undefined,
      priority,
      category,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
    });

    formDir.resetForm({ priority: 'medium', category: DEFAULT_CATEGORIES[0] });
  }
}