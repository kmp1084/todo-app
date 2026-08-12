import { Routes } from '@angular/router';
import { TasksPage } from './pages/tasks-page/tasks-page';

export const routes: Routes = [
  { path: '', component: TasksPage },
  { path: '**', redirectTo: '' },     // unknown URLs fall back to the task list
];