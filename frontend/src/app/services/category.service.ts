import { Service, inject, signal } from '@angular/core';
import { DEFAULT_CATEGORIES } from '../models/task';
import { TaskService } from './task.service';

@Service()
export class CategoryService {
  private readonly taskService = inject(TaskService);

  private readonly categoriesSignal = signal<string[]>([...DEFAULT_CATEGORIES]);
  readonly categories = this.categoriesSignal.asReadonly();

  isPreset(name: string): boolean {
    return DEFAULT_CATEGORIES.some((c) => c.toLowerCase() === name.toLowerCase());
  }

  private exists(name: string): boolean {
    const target = name.trim().toLowerCase();
    return this.categoriesSignal().some((c) => c.toLowerCase() === target);
  }

  addCategory(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed || this.exists(trimmed)) {
      return false;
    }
    this.categoriesSignal.update((list) => [...list, trimmed]);
    return true;
  }

  renameCategory(oldName: string, newName: string): boolean {
    const trimmed = newName.trim();

    if (this.isPreset(oldName) || !this.exists(oldName)) {
      return false;
    }
    if (!trimmed) {
      return false;
    }
    const isSameName = trimmed.toLowerCase() === oldName.toLowerCase();
    if (!isSameName && this.exists(trimmed)) {
      return false;
    }

    this.categoriesSignal.update((list) =>
      list.map((c) => (c === oldName ? trimmed : c)),
    );
    this.taskService.reassignCategory(oldName, trimmed);
    return true;
  }

  deleteCategory(name: string): { deleted: boolean; inUse: number } {
    if (this.isPreset(name)) {
      return { deleted: false, inUse: 0 };
    }

    const inUse = this.taskService.countByCategory(name);
    if (inUse > 0) {
      return { deleted: false, inUse };
    }

    this.categoriesSignal.update((list) => list.filter((c) => c !== name));
    return { deleted: true, inUse: 0 };
  }
}