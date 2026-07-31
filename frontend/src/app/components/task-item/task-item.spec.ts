import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskItem } from './task-item';
import { Task } from '../../models/task';

describe('TaskItem', () => {
  let component: TaskItem;
  let fixture: ComponentFixture<TaskItem>;

  const sampleTask: Task = {
    id: 't1',
    title: 'Buy milk',
    completed: false,
    priority: 'medium',
    category: 'Personal',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TaskItem] }).compileComponents();
    fixture = TestBed.createComponent(TaskItem);
    fixture.componentRef.setInput('task', sampleTask);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the task title', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.task-title')?.textContent).toContain('Buy milk');
  });

  it('emits editRequested when the edit button is clicked', () => {
    let emitted = false;
    component.editRequested.subscribe(() => (emitted = true));

    const btn = fixture.nativeElement.querySelector('button[aria-label="Edit Buy milk"]') as HTMLButtonElement;
    btn.click();

    expect(emitted).toBe(true);
  });

  it('emits deleteRequested when the delete button is clicked', () => {
    let emitted = false;
    component.deleteRequested.subscribe(() => (emitted = true));

    const btn = fixture.nativeElement.querySelector('button[aria-label="Delete Buy milk"]') as HTMLButtonElement;
    btn.click();

    expect(emitted).toBe(true);
  });
});