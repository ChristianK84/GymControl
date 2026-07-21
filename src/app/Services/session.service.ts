import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { TokenResponse } from '../Models/token-response';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly platformId = inject(PLATFORM_ID);

  isAuthenticated = signal(false);

  constructor() {
    this.checkSession();
  }

  private checkSession(): void {
    const token = this.getToken();
    const user = this.getUser();

    if (Capacitor.isNativePlatform() && token && localStorage.getItem('app_started_at')) {
      localStorage.removeItem('app_started_at');
      this.clearSession();
      this.isAuthenticated.set(false);
      return;
    }

    this.isAuthenticated.set(token !== null && user !== null && !this.isTokenExpired(token));
  }

  private isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (payload.exp * 1000) < Date.now();
    } catch {
      return true;
    }
  }

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? localStorage : null;
  }

  getToken(): string | null {
    return this.storage?.getItem(this.TOKEN_KEY) ?? null;
  }

  getTokenExpiry(): Date | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch {
      return null;
    }
  }

  isTokenExpiringSoon(thresholdMinutes: number = 5): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return false;
    return Date.now() + thresholdMinutes * 60 * 1000 >= expiry.getTime();
  }

  refreshSession(response: TokenResponse): void {
    this.storage?.setItem(this.TOKEN_KEY, response.access_token);
    this.storage?.setItem(this.USER_KEY, JSON.stringify({
      user_id: response.user_id,
      username: response.username,
      full_name: response.full_name,
      role_id: response.role_id,
      maestro_id: response.maestro_id,
    }));
    this.isAuthenticated.set(true);
  }

  getUser(): Omit<TokenResponse, 'access_token' | 'token_type'> | null {
    const data = this.storage?.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveSession(response: TokenResponse): void {
    this.storage?.setItem(this.TOKEN_KEY, response.access_token);
    this.storage?.setItem(this.USER_KEY, JSON.stringify({
      user_id: response.user_id,
      username: response.username,
      full_name: response.full_name,
      role_id: response.role_id,
      maestro_id: response.maestro_id,
    }));
    this.isAuthenticated.set(true);
  }

  getMaestroId(): number | null {
    return this.getUser()?.maestro_id ?? null;
  }

  clearSession(): void {
    this.storage?.removeItem(this.TOKEN_KEY);
    this.storage?.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
  }
}
