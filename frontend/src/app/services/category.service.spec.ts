import { TestBed } from '@angular/core/testing';

import { CategoryService } from './category.service';
import { TaskService } from './task.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let taskService: TaskService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoryService);
    taskService = TestBed.inject(TaskService);
  });

  it('starts with the preset categories', () => {
    expect(service.categories()).toEqual(['Work', 'Personal', 'Shopping', 'Health']);
  });

  it('adds a new user category', () => {
    expect(service.addCategory('Fitness')).toBe(true);
    expect(service.categories()).toContain('Fitness');
  });

  it('rejects a blank or duplicate category (case-insensitive)', () => {
    expect(service.addCategory('   ')).toBe(false);
    expect(service.addCategory('work')).toBe(false); // 'Work' already exists
    expect(service.categories().length).toBe(4);
  });

  it('renames a user category and updates tasks using it', () => {
    service.addCategory('Fitness');
    taskService.addTask({ title: 'Run', priority: 'low', category: 'Fitness' });

    expect(service.renameCategory('Fitness', 'Health & Fitness')).toBe(true);
    expect(service.categories()).toContain('Health & Fitness');
    expect(service.categories()).not.toContain('Fitness');
    expect(taskService.countByCategory('Health & Fitness')).toBe(1);
    expect(taskService.countByCategory('Fitness')).toBe(0);
  });

  it('refuses to rename a preset category', () => {
    expect(service.renameCategory('Work', 'Job')).toBe(false);
    expect(service.categories()).toContain('Work');
  });

  it('deletes an unused user category', () => {
    service.addCategory('Fitness');

    const result = service.deleteCategory('Fitness');

    expect(result).toEqual({ deleted: true, inUse: 0 });
    expect(service.categories()).not.toContain('Fitness');
  });

  it('blocks deleting a category that is in use, and reports the count', () => {
    service.addCategory('Fitness');
    taskService.addTask({ title: 'Run', priority: 'low', category: 'Fitness' });
    taskService.addTask({ title: 'Swim', priority: 'low', category: 'Fitness' });

    const result = service.deleteCategory('Fitness');

    expect(result).toEqual({ deleted: false, inUse: 2 });
    expect(service.categories()).toContain('Fitness'); // still there
  });

  it('refuses to delete a preset category', () => {
    const result = service.deleteCategory('Work');

    expect(result).toEqual({ deleted: false, inUse: 0 });
    expect(service.categories()).toContain('Work');
  });
});