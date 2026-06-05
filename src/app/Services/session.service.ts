import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TokenResponse } from '../Models/token-response';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly platformId = inject(PLATFORM_ID);

  isAuthenticated = signal(false);

  constructor() {
    this.isAuthenticated.set(this.getToken() !== null);
  }

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? localStorage : null;
  }

  getToken(): string | null {
    return this.storage?.getItem(this.TOKEN_KEY) ?? null;
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
    }));
    this.isAuthenticated.set(true);
  }

  clearSession(): void {
    this.storage?.removeItem(this.TOKEN_KEY);
    this.storage?.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
  }
}
