import { Component } from '@angular/core';
import { TaskForm } from '../../components/task-form/task-form';
import { TaskList } from '../../components/task-list/task-list';

@Component({
  selector: 'app-tasks-page',
  imports: [TaskForm, TaskList],
  template: `
    <app-task-form />
    <app-task-list />
  `,
  styles: ``,
})
export class TasksPage {}
