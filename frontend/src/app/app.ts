import { Component, inject, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ManageCategoriesDialog } from './components/manage-categories-dialog/manage-categories-dialog';
import { TaskService } from './services/task.service';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

function isAuthRoute(url: string): boolean {
  return url.startsWith('/login') || url.startsWith('/register');
}

@Component({
  selector: 'app-root',
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly dialog = inject(MatDialog);
  private readonly taskService = inject(TaskService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly showCategoryButton = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => !isAuthRoute(e.urlAfterRedirects)),
    ),
    { initialValue: true },
  );
  protected readonly title = signal('Todos');
  protected readonly error = this.taskService.error;
  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly userEmail = this.auth.email;

  manageCategories(): void {
    this.dialog.open(ManageCategoriesDialog, { width: '400px' });
  }

  dismissError(): void {
    this.taskService.clearError();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}