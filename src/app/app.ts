import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { App as CapacitorApp } from '@capacitor/app';

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
  private routerSub?: Subscription;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      history.pushState(null, '', location.href);

      window.addEventListener('popstate', this.onPopState);

      this.routerSub = this.router.events.pipe(
        filter(e => e instanceof NavigationEnd)
      ).subscribe(() => {
        history.pushState(null, '', location.href);
      });
    }

    if (this.platform.is('android')) {
      CapacitorApp.addListener('backButton', () => {});
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
  }
}
