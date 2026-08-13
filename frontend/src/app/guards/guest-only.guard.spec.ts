import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { guestOnlyGuard } from './guest-only.guard';

describe('guestOnlyGuard', () => {
  function configure(): void {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  }

  function run(): boolean | UrlTree {
    return TestBed.runInInjectionContext(
      () => guestOnlyGuard({} as never, {} as never) as boolean | UrlTree,
    );
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('lets a guest reach the auth pages', () => {
    configure();
    expect(run()).toBe(true);
  });

  it('redirects a signed-in user to the task list', () => {
    localStorage.setItem('todos.auth.token', 'test-token');
    localStorage.setItem('todos.auth.email', 'a@example.com');
    localStorage.setItem('todos.auth.expiresAt', new Date(Date.now() + 3_600_000).toISOString());
    configure();

    const result = run();
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });
});