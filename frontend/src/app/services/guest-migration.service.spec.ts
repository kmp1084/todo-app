import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { GuestMigrationService } from './guest-migration.service';
import { LocalTaskStore } from './local-task-store';
import { environment } from '../../environments/environment';

const tasksUrl = `${environment.apiUrl}/tasks`;

describe('GuestMigrationService', () => {
  let httpMock: HttpTestingController;
  let local: LocalTaskStore;
  let migration: GuestMigrationService;

  function setUp(dialogAnswer: boolean): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(dialogAnswer) }) } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    local = TestBed.inject(LocalTaskStore);
    migration = TestBed.inject(GuestMigrationService);
  }

  function serverEcho(body: Record<string, unknown>, id: string) {
    return { ...body, id, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('does nothing when there are no guest tasks', () => {
    setUp(true);
    let completed = false;

    migration.run().subscribe(() => (completed = true));

    expect(completed).toBe(true);
    httpMock.expectNone(tasksUrl);
  });

  it('posts each guest task in order and clears it locally', () => {
    setUp(true);
    local.add({ title: 'One', priority: 'low', category: 'Errands' });
    local.add({ title: 'Two', priority: 'high', category: 'Work' });

    migration.run().subscribe();

    const first = httpMock.expectOne(tasksUrl);
    expect(first.request.method).toBe('POST');
    expect(first.request.body.title).toBe('One');
    first.flush(serverEcho(first.request.body, 's1'));

    const second = httpMock.expectOne(tasksUrl);
    expect(second.request.body.title).toBe('Two');
    second.flush(serverEcho(second.request.body, 's2'));

    httpMock.expectOne(tasksUrl).flush([]);   // the reload afterwards

    expect(local.tasks()).toEqual([]);
  });

  it('keeps a task locally when its POST fails', () => {
    setUp(true);
    local.add({ title: 'One', priority: 'low', category: 'Work' });
    local.add({ title: 'Two', priority: 'low', category: 'Work' });

    migration.run().subscribe();

    httpMock.expectOne(tasksUrl).flush(null, { status: 500, statusText: 'Server Error' });

    const second = httpMock.expectOne(tasksUrl);
    second.flush(serverEcho(second.request.body, 's2'));

    httpMock.expectOne(tasksUrl).flush([]);

    expect(local.tasks().map((t) => t.title)).toEqual(['One']);
  });

  it('migrates nothing when the user cancels', () => {
    setUp(false);
    local.add({ title: 'One', priority: 'low', category: 'Work' });

    migration.run().subscribe();

    httpMock.expectNone(tasksUrl);
    expect(local.tasks().length).toBe(1);
  });
});