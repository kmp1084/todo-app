import { Service, computed, effect, inject, signal, untracked } from '@angular/core';
import { DEFAULT_CATEGORIES } from '../models/task';
import { AuthService } from './auth.service';
import { TaskService } from './task.service';

const GUEST_KEY = 'todos.categories';                       // ① unchanged, so existing data survives
const accountKey = (email: string) => `todos.categories.${email.toLowerCase()}`;

function isPresetName(name: string): boolean {
  return DEFAULT_CATEGORIES.some((c) => c.toLowerCase() === name.toLowerCase());
}

function load(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const custom = raw ? (JSON.parse(raw) as string[]) : [];
    return [...DEFAULT_CATEGORIES, ...custom];
  } catch {
    return [...DEFAULT_CATEGORIES];
  }
}

function save(key: string, list: string[]): void {
  localStorage.setItem(key, JSON.stringify(list.filter((c) => !isPresetName(c))));
}

@Service()
export class CategoryService {
  private readonly taskService = inject(TaskService);
  private readonly auth = inject(AuthService);

  private readonly managed = signal<string[]>(load(GUEST_KEY));
  private activeKey = GUEST_KEY;

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
    // Swap lists when the signed-in identity changes.
    effect(() => {
      const email = this.auth.email();                       // ② the only tracked read
      const nextKey = email ? accountKey(email) : GUEST_KEY;
      if (nextKey === this.activeKey) {
        return;
      }

      untracked(() => {                                      // ③
        save(this.activeKey, this.managed());                // keep the outgoing list

        if (email === null) {
          save(GUEST_KEY, this.managed());                   // signing out: carry it into guest
          this.activeKey = GUEST_KEY;
        } else {
          this.activeKey = nextKey;
          this.managed.set(load(nextKey));                   // signing in: this account's own list
        }
      });
    });

    // Persist edits under whichever list is active.
    effect(() => {
      const list = this.managed();
      untracked(() => save(this.activeKey, list));
    });

    // Anything a task surfaces becomes part of this account's own list,
    // so it survives sign-out and outlives the task that introduced it.
    effect(() => {
      const used = this.taskService
        .allTasks()
        .map((t) => t.category?.trim())
        .filter((c): c is string => !!c);

      untracked(() => {
        const known = new Set(this.managed().map((c) => c.toLowerCase()));
        const additions: string[] = [];

        for (const name of used) {
          if (!known.has(name.toLowerCase())) {
            known.add(name.toLowerCase());
            additions.push(name);
          }
        }

        if (additions.length > 0) {
          this.managed.update((list) => [...list, ...additions]);
        }
      });
    });
  }

  isPreset(name: string): boolean {
    return isPresetName(name);
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
}