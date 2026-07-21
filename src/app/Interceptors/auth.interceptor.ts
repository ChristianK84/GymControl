import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from '../Services/session.service';
import { ApiService } from '../Services/api-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const api = inject(ApiService);
  const token = session.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401 && !req.url.includes('auth/refresh')) {
        return api.refreshToken().pipe(
          switchMap((response) => {
            session.refreshSession(response);
            const cloned = req.clone({
              setHeaders: { Authorization: `Bearer ${response.access_token}` },
            });
            return next(cloned);
          }),
          catchError(() => {
            session.clearSession();
            if (isPlatformBrowser(platformId)) {
              sessionStorage.setItem('session_expired', '1');
            }
            router.navigate(['/login']);
            return throwError(() => err);
          }),
        );
      }
      if (err.status === 403) {
        if (isPlatformBrowser(platformId)) {
          sessionStorage.setItem('access_denied', '1');
        }
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
