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
import {
  diasRestantes as calcularDiasRestantes,
  edadACumplir as calcularEdadACumplir,
  formatoDiaMes,
} from '../../Utils/date-utils';

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
    return formatoDiaMes(dateStr);
  }

  diasRestantes(dateStr: string): number {
    return calcularDiasRestantes(dateStr);
  }

  edadACumplir(dateStr: string): number {
    return calcularEdadACumplir(dateStr);
  }
}
