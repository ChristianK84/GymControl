import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonButtons } from '@ionic/angular/standalone';
import { SessionService } from '../../Services/session.service';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonButtons],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>GymControl</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="logout()">
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h2>Bienvenido, {{ userName }}</h2>
      <p>Has iniciado sesión correctamente.</p>
    </ion-content>
  `,
})
export class Home {
  private session = inject(SessionService);
  private router = inject(Router);

  userName = this.session.getUser()?.full_name ?? 'Usuario';

  constructor() {
    addIcons({ logOutOutline });
    const user = this.session.getUser();
    if (user) {
      this.userName = user.full_name;
    }
  }

  logout(): void {
    this.session.clearSession();
    this.router.navigate(['/login']);
  }
}
