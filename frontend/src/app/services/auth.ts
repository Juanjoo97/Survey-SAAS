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
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = localStorage.getItem(this.tokenKey);

    if (!token) {
      return;
    }


    const decoded = this.decodeToken(token);
    if (!decoded) {
      localStorage.removeItem(this.tokenKey);
      return;
    }

    // Verificar expiración
    const isExpired = decoded.exp && (decoded.exp * 1000) < Date.now();

    if (isExpired) {
      this.logout();
      return;
    }

    // CONSTRUIR el objeto user correctamente
    const user: User = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      token: token,
      role: decoded.role
    };
    this.userSignal.set(user);
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (e) {
      return null;
    }
  }

  register(userData: { username: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap((response) => {
        this.setSession(response);
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        this.setSession(response);
      })
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

  getUserId(): number | null {
    const user = this.userSignal();
    return user?.id ?? null;
  }

  getUserEmail(): string | null {
    const user = this.userSignal();
    return user?.email ?? null;
  }

  private setSession(authResult: AuthResponse): void {

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, authResult.token);
    }

    const user: User = {
      ...authResult.user,
      token: authResult.token
    };
    this.userSignal.set(user);
  }

  isTokenExpiringSoon(minutesThreshold: number = 5): boolean {
    const token = this.getToken();
    if (!token) return false;

    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return false;

    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    const thresholdMs = minutesThreshold * 60 * 1000;

    return timeUntilExpiration < thresholdMs && timeUntilExpiration > 0;
  }
}
