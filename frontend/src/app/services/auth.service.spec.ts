import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const authUrl = `${environment.apiUrl}/auth`;

function loginResponse(email = 'pawan@example.com') {
  return { token: 'a.b.c', expiresAt: new Date(Date.now() + 3_600_000).toISOString(), email };
}

function storeSession(expiresAt: string) {
  localStorage.setItem('todos.auth.token', 'stored.token');
  localStorage.setItem('todos.auth.email', 'stored@example.com');
  localStorage.setItem('todos.auth.expiresAt', expiresAt);
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  function create(): void {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts signed out', () => {
    create();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.token()).toBeNull();
  });

  it('stores the session on login', () => {
    create();

    service.login('Pawan@Example.COM', 'correcthorse').subscribe();
    const req = httpMock.expectOne(`${authUrl}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(loginResponse());

    expect(service.isLoggedIn()).toBe(true);
    expect(service.email()).toBe('pawan@example.com');
    expect(localStorage.getItem('todos.auth.token')).toBe('a.b.c');
  });

  it('registers and then logs in', () => {
    create();

    service.register('new@example.com', 'correcthorse').subscribe();

    const register = httpMock.expectOne(`${authUrl}/register`);
    expect(register.request.method).toBe('POST');
    register.flush({ id: '1', email: 'new@example.com', createdAt: '2026-01-01T00:00:00Z' });

    httpMock.expectOne(`${authUrl}/login`).flush(loginResponse('new@example.com'));

    expect(service.isLoggedIn()).toBe(true);
    expect(service.email()).toBe('new@example.com');
  });

  it('clears the session on logout', () => {
    create();
    service.login('a@example.com', 'x').subscribe();
    httpMock.expectOne(`${authUrl}/login`).flush(loginResponse('a@example.com'));

    service.logout();

    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('todos.auth.token')).toBeNull();
  });

  it('restores a valid stored session', () => {
    storeSession(new Date(Date.now() + 3_600_000).toISOString());
    create();

    expect(service.isLoggedIn()).toBe(true);
    expect(service.email()).toBe('stored@example.com');
  });

  it('discards an expired stored session', () => {
    storeSession(new Date(Date.now() - 1000).toISOString());
    create();

    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('todos.auth.token')).toBeNull();
  });
});