import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  token: string;
  expiresAt: string;
  email: string;
}

const TOKEN_KEY = 'todos.auth.token';
const EMAIL_KEY = 'todos.auth.email';
const EXPIRES_KEY = 'todos.auth.expiresAt';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly tokenSignal = signal<string | null>(null);
  private readonly emailSignal = signal<string | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly email = this.emailSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.tokenSignal() !== null);

  constructor() {
    this.restoreSession();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, { email, password })
      .pipe(tap((response) => this.startSession(response)));      // ①
  }

  register(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post(`${this.baseUrl}/register`, { email, password })
      .pipe(switchMap(() => this.login(email, password)));        // ②
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    this.tokenSignal.set(null);
    this.emailSignal.set(null);
  }

  private startSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(EMAIL_KEY, response.email);
    localStorage.setItem(EXPIRES_KEY, response.expiresAt);
    this.tokenSignal.set(response.token);
    this.emailSignal.set(response.email);
  }

  private restoreSession(): void {                                 // ③
    const token = localStorage.getItem(TOKEN_KEY);
    const email = localStorage.getItem(EMAIL_KEY);
    const expiresAt = localStorage.getItem(EXPIRES_KEY);

    if (!token || !email || !expiresAt || new Date(expiresAt) <= new Date()) {
      this.logout();
      return;
    }

    this.tokenSignal.set(token);
    this.emailSignal.set(email);
  }
}