import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';

import { TaskForm } from './task-form';

describe('TaskForm', () => {
  let component: TaskForm;
  let fixture: ComponentFixture<TaskForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskForm],
      providers: [provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts with sensible defaults', () => {
    expect(component.form.controls.title.value).toBe('');
    expect(component.form.controls.priority.value).toBe('medium');
    expect(component.form.controls.category.value).toBe('Work');
    expect(component.form.controls.dueDate.value).toBeNull();
  });

  it('requires a title', () => {
    expect(component.form.controls.title.hasError('required')).toBe(true);

    component.form.controls.title.setValue('Buy milk');

    expect(component.form.controls.title.hasError('required')).toBe(false);
    expect(component.form.valid).toBe(true);
  });
});