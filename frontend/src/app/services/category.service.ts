import { Service, computed, effect, inject, signal } from '@angular/core';
import { DEFAULT_CATEGORIES } from '../models/task';
import { TaskService } from './task.service';

export const CATEGORY_STORAGE_KEY = 'todos.categories';

@Service()
export class CategoryService {
  private readonly taskService = inject(TaskService);

  /** Presets plus categories explicitly created on this device. */
  private readonly managed = signal<string[]>(this.loadFromStorage());

  /** What the UI sees: the managed list, plus any category a loaded task uses. */
  readonly categories = computed(() => {
    const result = [...this.managed()];
    const seen = new Set(result.map((c) => c.toLowerCase()));

    for (const task of this.taskService.allTasks()) {
      const name = task.category?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        result.push(name);
      }
    }
    return result;
  });

  constructor() {
    effect(() => {
      const custom = this.managed().filter((c) => !this.isPreset(c));
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(custom));
    });
  }

  isPreset(name: string): boolean {
    return DEFAULT_CATEGORIES.some((c) => c.toLowerCase() === name.toLowerCase());
  }

  private exists(name: string): boolean {
    const target = name.trim().toLowerCase();
    return this.categories().some((c) => c.toLowerCase() === target);
  }

  addCategory(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed || this.exists(trimmed)) {
      return false;
    }
    this.managed.update((list) => [...list, trimmed]);
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

    this.managed.update((list) => list.map((c) => (c === oldName ? trimmed : c)));
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

    this.managed.update((list) => list.filter((c) => c !== name));
    return { deleted: true, inUse: 0 };
  }

  private loadFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
      const custom = raw ? (JSON.parse(raw) as string[]) : [];
      return [...DEFAULT_CATEGORIES, ...custom];
    } catch {
      return [...DEFAULT_CATEGORIES];
    }
  }
}