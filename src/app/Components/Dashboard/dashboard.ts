import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { ApiService } from '../../Services/api-service';
import { SessionService } from '../../Services/session.service';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  peopleOutline,
  bodyOutline,
  checkmarkCircleOutline,
  personOutline,
  logOutOutline,
  menuOutline,
  chevronBackOutline,
  chevronForwardOutline,
  documentTextOutline,
  pricetagOutline,
  cardOutline,
} from 'ionicons/icons';

const ROLE_MAP: Record<number, string> = {
  1: 'Administrador',
  2: 'Maestro',
};

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private session = inject(SessionService);
  private router = inject(Router);
  private api = inject(ApiService);

  private clockInterval?: ReturnType<typeof setInterval>;

  user = this.session.getUser();
  userName = this.user?.full_name ?? 'Usuario';
  userRole = ROLE_MAP[this.user?.role_id ?? 0] ?? 'Usuario';
  collapsed = signal(true);
  mobileOpen = signal(false);
  clockDate = signal(this.formatDate());
  clockTime = signal(this.formatTime());

  readonly fullNavItems = [
    { icon: 'people-outline', label: 'Alumnos', route: '/dashboard/alumnos' as string | null, roles: [1, 2] },
    { icon: 'body-outline', label: 'Maestros', route: '/dashboard/maestros' as string | null, roles: [1] },
    { icon: 'checkmark-circle-outline', label: 'Asistencias', route: '/dashboard/asistencias' as string | null, roles: [1, 2] },
    { icon: 'card-outline', label: 'Membresías', route: '/dashboard/membresias' as string | null, roles: [1] },
    { icon: 'pricetag-outline', label: 'Tipos Membresía', route: '/dashboard/tipos-membresia' as string | null, roles: [1] },
    { icon: 'person-outline', label: 'Usuarios', route: '/dashboard/usuarios' as string | null, roles: [1] },
    { icon: 'document-text-outline', label: 'Auditoría', route: '/dashboard/auditoria' as string | null, roles: [1] },
  ];

  get navItems() {
    const role = this.user?.role_id ?? 0;
    return this.fullNavItems.filter(item => item.roles.includes(role));
  }

  constructor() {
    addIcons({
      gridOutline, peopleOutline, bodyOutline, checkmarkCircleOutline,
      personOutline, logOutOutline, menuOutline,
      chevronBackOutline, chevronForwardOutline,
      documentTextOutline,
      pricetagOutline, cardOutline,
    });
  }

  ngOnInit(): void {
    if (!this.session.isAuthenticated()) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }
    this.clockInterval = setInterval(() => {
      this.clockDate.set(this.formatDate());
      this.clockTime.set(this.formatTime());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  private formatDate(): string {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatTime(): string {
    return new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  toggleCollapse(): void {
    this.collapsed.set(!this.collapsed());
  }

  toggleMobile(): void {
    this.mobileOpen.set(!this.mobileOpen());
  }

  closeMobile(): void {
    (document.activeElement as HTMLElement)?.blur();
    this.mobileOpen.set(false);
  }

  goTo(route: string | null): void {
    this.mobileOpen.set(false);
    if (route) {
      this.router.navigate([route]);
    }
  }

  logout(): void {
    (document.activeElement as HTMLElement)?.blur();
    this.api.logout().subscribe({
      next: () => this.session.clearSession(),
      error: () => this.session.clearSession(),
      complete: () => this.router.navigate(['/login'], { replaceUrl: true }),
    });
  }
}
