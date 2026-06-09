import { Injectable, PLATFORM_ID, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  role: string;
  id: number;
  email: string;
  username?: string;
  token?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private tokenKey = 'auth_token';

  private userSignal = signal<User | null>(null);
  public currentUser = computed(() => this.userSignal());
  public isAuthenticated = computed(() => this.userSignal() !== null);
  public redirectUrl: string | null = null;

  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.initAuth();
  }

  private initAuth(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem(this.tokenKey);
    if (!token) return;

    const decoded = this.decodeToken(token);
    if (!decoded) {
      localStorage.removeItem(this.tokenKey);
      return;
    }

    const isExpired = decoded.exp && (decoded.exp * 1000) < Date.now();
    if (isExpired) {
      this.logout();
      return;
    }

    this.userSignal.set({
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      token,
      role: decoded.role
    });
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  register(userData: { username: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap((response) => this.setSession(response))
    );
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.setSession(response))
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
    }
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  private setSession(authResult: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, authResult.token);
    }
    this.userSignal.set({ ...authResult.user, token: authResult.token });
  }
}
