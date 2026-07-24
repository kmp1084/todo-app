import { TestBed } from '@angular/core/testing';

import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
  });

  function addSample(title = 'Buy milk') {
    service.addTask({ title, priority: 'medium', category: 'Personal' });
    return service.allTasks()[0];
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with no tasks', () => {
    expect(service.allTasks()).toEqual([]);
    expect(service.totalCount()).toBe(0);
  });

  it('adds a task with an id, timestamps and completed=false', () => {
    const task = addSample();

    expect(service.totalCount()).toBe(1);
    expect(task.title).toBe('Buy milk');
    expect(task.completed).toBe(false);
    expect(task.id).toBeTruthy();
    expect(task.createdAt).toBeTruthy();
  });

  it('trims whitespace from the title', () => {
    const task = addSample('   Walk the dog   ');
    expect(task.title).toBe('Walk the dog');
  });

  it('toggles completion and updates the completed count', () => {
    const task = addSample();

    service.toggleComplete(task.id);
    expect(service.allTasks()[0].completed).toBe(true);
    expect(service.completedCount()).toBe(1);

    service.toggleComplete(task.id);
    expect(service.allTasks()[0].completed).toBe(false);
    expect(service.completedCount()).toBe(0);
  });

  it('counts tasks in a category', () => {
    service.addTask({ title: 'A', priority: 'low', category: 'Work' });
    service.addTask({ title: 'B', priority: 'low', category: 'Work' });
    service.addTask({ title: 'C', priority: 'low', category: 'Personal' });

    expect(service.countByCategory('Work')).toBe(2);
    expect(service.countByCategory('Personal')).toBe(1);
    expect(service.countByCategory('Nope')).toBe(0);
  });

  it('reassigns tasks from one category to another', () => {
    service.addTask({ title: 'A', priority: 'low', category: 'Work' });
    service.addTask({ title: 'B', priority: 'low', category: 'Personal' });

    service.reassignCategory('Work', 'Job');

    expect(service.countByCategory('Work')).toBe(0);
    expect(service.countByCategory('Job')).toBe(1);
    expect(service.countByCategory('Personal')).toBe(1); // untouched
  });

  it('updates an existing task', () => {
    const task = addSample();

    service.updateTask(task.id, { title: 'New title', priority: 'high' });

    const updated = service.allTasks()[0];
    expect(updated.title).toBe('New title');
    expect(updated.priority).toBe('high');
    expect(updated.id).toBe(task.id);
  });

  it('deletes a task', () => {
    const task = addSample();
    service.deleteTask(task.id);

    expect(service.allTasks()).toEqual([]);
    expect(service.totalCount()).toBe(0);
  });
});