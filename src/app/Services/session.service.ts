import { Injectable, signal } from '@angular/core';
import { TokenResponse } from '../Models/token-response';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  isAuthenticated = signal(false);

  constructor() {
    this.isAuthenticated.set(!!localStorage.getItem(this.TOKEN_KEY));
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): Omit<TokenResponse, 'access_token' | 'token_type'> | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveSession(response: TokenResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify({
      user_id: response.user_id,
      username: response.username,
      full_name: response.full_name,
      role_id: response.role_id,
    }));
    this.isAuthenticated.set(true);
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
  }
}
