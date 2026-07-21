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
    await TestBed.configureTestingModule({
      imports: [TaskItem],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskItem);
    fixture.componentRef.setInput('task', sampleTask);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('pre-fills the draft title when editing starts', () => {
    expect(component.editing()).toBe(false);

    component.startEditing();

    expect(component.editing()).toBe(true);
    expect(component.draftTitle()).toBe('Buy milk');
  });

  it('emits titleChanged with a trimmed title when it actually changed', () => {
    let emitted: string | undefined;
    component.titleChanged.subscribe((title) => {
      emitted = title;
    });

    component.startEditing();
    component.draftTitle.set('   Buy oat milk   ');
    component.save();

    expect(emitted).toBe('Buy oat milk');
    expect(component.editing()).toBe(false);
  });

  it('does not emit when the new title is blank', () => {
    let emitted: string | undefined;
    component.titleChanged.subscribe((title) => {
      emitted = title;
    });

    component.startEditing();
    component.draftTitle.set('    ');
    component.save();

    expect(emitted).toBeUndefined();
  });

  it('discards the draft when cancelled, even if a blur-save follows', () => {
    let emitted: string | undefined;
    component.titleChanged.subscribe((title) => {
      emitted = title;
    });

    component.startEditing();
    component.draftTitle.set('Should be discarded');
    component.cancelEditing();
    component.save(); // the stray blur-triggered save

    expect(emitted).toBeUndefined();
    expect(component.editing()).toBe(false);
  });
});