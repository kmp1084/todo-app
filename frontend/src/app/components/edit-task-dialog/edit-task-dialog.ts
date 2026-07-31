import { Component, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { Priority, Task } from '../../models/task';

@Component({
  selector: 'app-edit-task-dialog',
  imports: [
    ReactiveFormsModule,
    TitleCasePipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  templateUrl: './edit-task-dialog.html',
  styleUrl: './edit-task-dialog.scss',
})
export class EditTaskDialog {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialogRef = inject(MatDialogRef<EditTaskDialog>);
  private readonly task = inject<Task>(MAT_DIALOG_DATA);

  readonly priorities: Priority[] = ['low', 'medium', 'high'];
  readonly categories = this.categoryService.categories;

  readonly form = this.fb.nonNullable.group({
    title: [this.task.title, [Validators.required, Validators.maxLength(100)]],
    description: [this.task.description ?? ''],
    priority: [this.task.priority],
    category: [this.task.category],
    dueDate: this.fb.control<Date | null>(
      this.task.dueDate ? new Date(this.task.dueDate) : null,
    ),
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, priority, category, dueDate } = this.form.getRawValue();

    this.taskService.updateTask(this.task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
    });

    this.dialogRef.close(true);
  }
}