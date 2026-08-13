import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const tasksUrl = `${environment.apiUrl}/tasks`;
const loginUrl = `${environment.apiUrl}/auth/login`;

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;
  let navigated: string[];

  function signInFirst(): void {
    localStorage.setItem('todos.auth.token', 'test-token');
    localStorage.setItem('todos.auth.email', 'a@example.com');
    localStorage.setItem('todos.auth.expiresAt', new Date(Date.now() + 3_600_000).toISOString());
  }

  function setUp(): void {
    navigated = [];
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: {
            navigateByUrl: (url: string) => {
              navigated.push(url);
              return Promise.resolve(true);
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('attaches the bearer token to API requests', () => {
    signInFirst();
    setUp();

    http.get(tasksUrl).subscribe();
    const req = httpMock.expectOne(tasksUrl);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush([]);
  });

  it('sends no Authorization header when signed out', () => {
    setUp();

    http.get(tasksUrl).subscribe();
    const req = httpMock.expectOne(tasksUrl);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('never leaks the token to a non-API url', () => {
    signInFirst();
    setUp();

    http.get('https://example.com/data').subscribe();
    const req = httpMock.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('logs out and redirects on a 401 when a token was sent', () => {
    signInFirst();
    setUp();
    expect(auth.isLoggedIn()).toBe(true);

    http.get(tasksUrl).subscribe({ error: () => undefined });
    httpMock.expectOne(tasksUrl).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isLoggedIn()).toBe(false);
    expect(navigated).toEqual(['/login']);
  });

  it('leaves a guest alone on a 401', () => {
    setUp();

    http.get(tasksUrl).subscribe({ error: () => undefined });
    httpMock.expectOne(tasksUrl).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(navigated).toEqual([]);
  });

  it('does not sign the user out when a login attempt fails', () => {
    signInFirst();
    setUp();

    http.post(loginUrl, {}).subscribe({ error: () => undefined });
    httpMock.expectOne(loginUrl).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isLoggedIn()).toBe(true);
    expect(navigated).toEqual([]);
  });
});