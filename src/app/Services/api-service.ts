import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenResponse } from '../Models/token-response';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private Auth = 'auth/';
  authToken: string = '';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<TokenResponse> {
    const url = environment.apiUrl + this.Auth + 'login';
    return this.http.post<TokenResponse>(url, { username, password });
  }
}
