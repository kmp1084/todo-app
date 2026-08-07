import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTaskStore } from './http-task-store';
import { environment } from '../../environments/environment';
import { Task } from '../models/task';

const baseUrl = `${environment.apiUrl}/tasks`;

function sample(overrides: Partial<Task> = {}): Task {
  return {
    id: 'id-1',
    title: 'Buy milk',
    completed: false,
    priority: 'high',
    category: 'Shopping',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

describe('HttpTaskStore', () => {
  let store: HttpTaskStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(HttpTaskStore); // constructor fires the initial GET
  });

  afterEach(() => httpMock.verify());

  it('loads tasks on creation', () => {
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([sample()]);

    expect(store.tasks().length).toBe(1);
    expect(store.tasks()[0].title).toBe('Buy milk');
  });

  it('posts a new task and appends the server response', () => {
    httpMock.expectOne(baseUrl).flush([]);

    store.add({ title: 'Walk the dog', priority: 'low', category: 'Personal' });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('Walk the dog');
    req.flush(sample({ id: 'server-id', title: 'Walk the dog' }));

    expect(store.tasks()[0].id).toBe('server-id');
  });

  it('toggles by putting the whole task with completed flipped', () => {
    httpMock.expectOne(baseUrl).flush([sample()]);

    store.toggle('id-1');

    const req = httpMock.expectOne(`${baseUrl}/id-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.completed).toBe(true);
    expect(req.request.body.title).toBe('Buy milk');
    req.flush(sample({ completed: true }));

    expect(store.tasks()[0].completed).toBe(true);
  });

  it('merges partial changes into the PUT body', () => {
    httpMock.expectOne(baseUrl).flush([sample()]);

    store.update('id-1', { priority: 'low' });

    const req = httpMock.expectOne(`${baseUrl}/id-1`);
    expect(req.request.body.priority).toBe('low');
    expect(req.request.body.title).toBe('Buy milk');
    expect(req.request.body.category).toBe('Shopping');
    expect(req.request.body.completed).toBe(false);
    req.flush(sample({ priority: 'low' }));
  });

  it('deletes and drops the task from the signal', () => {
    httpMock.expectOne(baseUrl).flush([sample()]);

    store.remove('id-1');

    const req = httpMock.expectOne(`${baseUrl}/id-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(store.tasks()).toEqual([]);
  });

  it('reports an unreachable server', () => {
    httpMock.expectOne(baseUrl).error(new ProgressEvent('error'), { status: 0, statusText: '' });

    expect(store.error()).toContain("can't reach the server");
  });

  it('surfaces the backend problem-detail message and keeps the task', () => {
    httpMock.expectOne(baseUrl).flush([sample()]);

    store.remove('id-1');
    httpMock.expectOne(`${baseUrl}/id-1`).flush(
      { title: 'Task not found', detail: 'Task not found: id-1', status: 404 },
      { status: 404, statusText: 'Not Found' },
    );

    expect(store.error()).toContain('Task not found: id-1');
    expect(store.tasks().length).toBe(1);
  });

  it('clears the error after a later success', () => {
    httpMock.expectOne(baseUrl).error(new ProgressEvent('error'), { status: 0, statusText: '' });
    expect(store.error()).not.toBeNull();

    store.add({ title: 'Retry', priority: 'low', category: 'Work' });
    httpMock.expectOne(baseUrl).flush(sample({ id: 'new', title: 'Retry' }));

    expect(store.error()).toBeNull();
  });
});