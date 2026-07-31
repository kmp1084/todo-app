import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';

import { EditTaskDialog } from './edit-task-dialog';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { Task } from '../../models/task';

describe('EditTaskDialog', () => {
  let component: EditTaskDialog;
  let fixture: ComponentFixture<EditTaskDialog>;
  let updateCalls: { id: string; changes: Partial<Task> }[];
  let closedWith: unknown;

  const task: Task = {
    id: 't1',
    title: 'Old title',
    description: 'old desc',
    completed: false,
    priority: 'low',
    category: 'Work',
    dueDate: '2026-06-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    updateCalls = [];
    closedWith = undefined;

    await TestBed.configureTestingModule({
      imports: [EditTaskDialog],
      providers: [
        provideNativeDateAdapter(),
        { provide: MAT_DIALOG_DATA, useValue: task },
        { provide: MatDialogRef, useValue: { close: (v: unknown) => (closedWith = v) } },
        { provide: TaskService, useValue: { updateTask: (id: string, changes: Partial<Task>) => updateCalls.push({ id, changes }) } },
        { provide: CategoryService, useValue: { categories: signal(['Work', 'Personal']) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTaskDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('pre-fills the form from the task', () => {
    expect(component.form.controls.title.value).toBe('Old title');
    expect(component.form.controls.description.value).toBe('old desc');
    expect(component.form.controls.priority.value).toBe('low');
    expect(component.form.controls.category.value).toBe('Work');
    expect(component.form.controls.dueDate.value).toEqual(new Date('2026-06-01T00:00:00.000Z'));
  });

  it('updates the task and closes on save', () => {
    component.form.controls.title.setValue('New title');
    component.form.controls.priority.setValue('high');

    component.save();

    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0].id).toBe('t1');
    expect(updateCalls[0].changes.title).toBe('New title');
    expect(updateCalls[0].changes.priority).toBe('high');
    expect(closedWith).toBe(true);
  });

  it('does not update or close when the title is blank', () => {
    component.form.controls.title.setValue('');
    component.save();

    expect(updateCalls.length).toBe(0);
    expect(closedWith).toBeUndefined();
  });
});