import { Component, inject, signal, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSkeletonText,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, warningOutline, checkmarkCircleOutline, schoolOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Membresia } from '../../Models/membresias';

@Component({
  selector: 'app-membresia-impagas-modal',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonSkeletonText,
  ],
  templateUrl: './membresia-impagas-modal.html',
  styleUrl: './membresia-form-modal.css',
})
export class MembresiaImpagasModal implements OnInit {
  private api = inject(ApiService);
  private modalCtrl = inject(ModalController);

  impagas = signal<Membresia[]>([]);
  loading = signal(true);

  constructor() {
    addIcons({ closeOutline, warningOutline, checkmarkCircleOutline, schoolOutline });
  }

  ngOnInit(): void {
    this.api.getMembresiasImpagas().subscribe({
      next: (data) => {
        this.impagas.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.impagas.set([]);
        this.loading.set(false);
      },
    });
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatCurrency(value: number): string {
    return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  }
}
