import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { SessionService } from './Services/session.service';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private platform = inject(Platform);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private sessionService = inject(SessionService);
  private routerSub?: Subscription;
  private stateChangeHandle?: { remove: () => void };

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      history.pushState(null, '', location.href);

      window.addEventListener('popstate', this.onPopState);

      this.routerSub = this.router.events.pipe(
        filter(e => e instanceof NavigationEnd)
      ).subscribe(() => {
        history.pushState(null, '', location.href);
      });
    }

    if (Capacitor.isNativePlatform()) {
      localStorage.setItem('app_started_at', String(Date.now()));

      CapacitorApp.addListener('backButton', () => {});

      const handle = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          localStorage.setItem('app_bg_at', String(Date.now()));
        } else {
          const bgAt = localStorage.getItem('app_bg_at');
          if (bgAt) {
            const elapsed = Date.now() - parseInt(bgAt, 10);
            if (elapsed > 300000) {
              sessionStorage.setItem('session_expired', '1');
              this.sessionService.clearSession();
              this.router.navigate(['/login'], { replaceUrl: true });
            }
            localStorage.removeItem('app_bg_at');
          }
        }
      });
      this.stateChangeHandle = handle;
    }
  }

  private onPopState = (): void => {
    history.pushState(null, '', location.href);
  };

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('popstate', this.onPopState);
    }
    this.routerSub?.unsubscribe();
    this.stateChangeHandle?.remove();
  }
}
