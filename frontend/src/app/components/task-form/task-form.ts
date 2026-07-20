import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TaskService } from '../../services/task.service';
import { SubmittedErrorStateMatcher } from '../../shared/submitted-error-state-matcher';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskForm {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
  });

  readonly errorMatcher = new SubmittedErrorStateMatcher();

  submit(formDir: FormGroupDirective): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.taskService.addTask({
      title: this.form.controls.title.value,
      priority: 'medium',
      category: 'Personal',
    });

    formDir.resetForm();
  }
}