import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../Services/session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const token = session.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        session.clearSession();
        if (isPlatformBrowser(platformId)) {
          sessionStorage.setItem('session_expired', '1');
        }
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
