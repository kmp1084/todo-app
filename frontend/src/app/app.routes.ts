import { Routes } from '@angular/router';
import { TasksPage } from './pages/tasks-page/tasks-page';
import { LoginPage } from './pages/login-page/login-page';
import { RegisterPage } from './pages/register-page/register-page';
import { guestOnlyGuard } from './guards/guest-only.guard';

export const routes: Routes = [
  { path: '', component: TasksPage },
  { path: 'login', component: LoginPage, canActivate: [guestOnlyGuard] },
  { path: 'register', component: RegisterPage, canActivate: [guestOnlyGuard] },
  { path: '**', redirectTo: '' },
];