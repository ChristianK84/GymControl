import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline, cloudUploadOutline, documentTextOutline, gridOutline, mailOutline } from 'ionicons/icons';

@Component({
  selector: 'app-administracion',
  imports: [IonIcon, RouterLink, RouterOutlet],
  templateUrl: './administracion.html',
  styleUrl: './administracion.css',
})
export class Administracion {
  private router = inject(Router);

  subNavItems = [
    { label: 'Menú', route: '/dashboard/administracion', icon: 'grid-outline', exact: true },
    { label: 'Enviar Bienvenida', route: '/dashboard/administracion/enviar-bienvenida', icon: 'mail-outline', exact: false },
    { label: 'Publicar Versión', route: '/dashboard/administracion/publicar-version', icon: 'cloud-upload-outline', exact: false },
    { label: 'Auditoría', route: '/dashboard/administracion/auditoria', icon: 'document-text-outline', exact: false },
  ];

  constructor() {
    addIcons({ settingsOutline, cloudUploadOutline, documentTextOutline, gridOutline, mailOutline });
  }

  isActive(route: string, exact: boolean): boolean {
    if (exact) {
      return this.router.url === route;
    }
    return this.router.url.startsWith(route);
  }
}
