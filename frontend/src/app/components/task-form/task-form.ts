import { Component, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { Priority } from '../../models/task';
import { SubmittedErrorStateMatcher } from '../../shared/submitted-error-state-matcher';
import { PromptDialog, PromptDialogData } from '../prompt-dialog/prompt-dialog';

const ADD_NEW = '__add_new__';

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
  private readonly categoryService = inject(CategoryService);
  private lastCategory = this.categoryService.categories()[0];
  private readonly dialog = inject(MatDialog);

  readonly priorities: Priority[] = ['low', 'medium', 'high'];
  readonly categories = this.categoryService.categories;

  readonly addNewValue = ADD_NEW;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    priority: ['medium' as Priority],
    category: [this.categoryService.categories()[0]],
    dueDate: this.fb.control<Date | null>(null),
  });

  readonly errorMatcher = new SubmittedErrorStateMatcher();

  onCategorySelection(value: string): void {
    if (value !== ADD_NEW) {
      this.lastCategory = value;
      return;
    }

    const data: PromptDialogData = {
      title: 'New category',
      label: 'Category name',
      confirmText: 'Add',
    };

    this.dialog
      .open(PromptDialog, { data, width: '360px' })
      .afterClosed()
      .subscribe((name: string | undefined) => {
        if (name && this.categoryService.addCategory(name)) {
          this.form.controls.category.setValue(name.trim());
        } else {
          this.form.controls.category.setValue(this.lastCategory);
        }
      });
  }

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

    formDir.resetForm({ priority: 'medium', category: this.categoryService.categories()[0] });
  }

  clear(formDir: FormGroupDirective): void {
    formDir.resetForm({ priority: 'medium', category: this.categoryService.categories()[0] });
  }
}