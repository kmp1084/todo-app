import { Component, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '../../services/category.service';
import { PromptDialog, PromptDialogData } from '../prompt-dialog/prompt-dialog';

@Component({
  selector: 'app-manage-categories-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './manage-categories-dialog.html',
  styleUrl: './manage-categories-dialog.scss',
})
export class ManageCategoriesDialog {
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);

  readonly categories = this.categoryService.categories;
  readonly message = signal('');

  isPreset(name: string): boolean {
    return this.categoryService.isPreset(name);
  }

  rename(name: string): void {
    const data: PromptDialogData = {
      title: 'Rename category',
      label: 'Category name',
      value: name,
      confirmText: 'Rename',
    };

    this.dialog
      .open(PromptDialog, { data, width: '360px' })
      .afterClosed()
      .subscribe((newName: string | undefined) => {
        if (!newName || newName.trim() === name) {
          return;
        }
        if (this.categoryService.renameCategory(name, newName)) {
          this.message.set('');
        } else {
          this.message.set(`"${newName.trim()}" is already taken.`);
        }
      });
  }

  remove(name: string): void {
    const result = this.categoryService.deleteCategory(name);
    if (result.deleted) {
      this.message.set('');
    } else if (result.inUse > 0) {
      this.message.set(`Can't delete "${name}" — ${result.inUse} task(s) still use it.`);
    }
  }
}