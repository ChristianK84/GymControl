import { Component, inject, signal, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSkeletonText,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, giftOutline, calendarOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Alumno } from '../../Models/alumnos';

@Component({
  selector: 'app-alumnos-cumpleanios-modal',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonSkeletonText,
  ],
  templateUrl: './alumnos-cumpleanios-modal.html',
  styleUrl: './alumnos-cumpleanios-modal.css',
})
export class AlumnosCumpleaniosModal implements OnInit {
  private api = inject(ApiService);
  private modalCtrl = inject(ModalController);

  cumpleanios = signal<Alumno[]>([]);
  loading = signal(true);

  constructor() {
    addIcons({ closeOutline, giftOutline, calendarOutline });
  }

  ngOnInit(): void {
    this.api.getCumpleanios().subscribe({
      next: (data) => {
        this.cumpleanios.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.cumpleanios.set([]);
        this.loading.set(false);
      },
    });
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  iniciales(nombre: string): string {
    return nombre.trim().split(' ').map((p) => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
  }

  proximoCumple(dateStr: string): Date {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const nac = new Date(dateStr);
    const prox = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate());
    if (prox < hoy) {
      prox.setFullYear(prox.getFullYear() + 1);
    }
    return prox;
  }

  diasRestantes(dateStr: string): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const prox = this.proximoCumple(dateStr);
    prox.setHours(0, 0, 0, 0);
    return Math.ceil((prox.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  edadACumplir(dateStr: string): number {
    const prox = this.proximoCumple(dateStr);
    const nac = new Date(dateStr);
    return prox.getFullYear() - nac.getFullYear();
  }
}
