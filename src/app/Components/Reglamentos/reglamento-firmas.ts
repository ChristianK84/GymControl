import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonIcon, IonBadge, IonSkeletonText,
  IonSelect, IonSelectOption, IonItem, IonLabel,
  IonHeader, IonToolbar, IonTitle, IonContent,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, closeCircleOutline, checkmarkCircleOutline,
  timeOutline, alertCircleOutline, documentTextOutline, arrowBackOutline,
} from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { FirmaReglamento, Reglamento } from '../../Models/reglamentos';

@Component({
  selector: 'app-reglamento-firmas',
  imports: [
    FormsModule, DatePipe, TitleCasePipe,
    IonButton, IonIcon, IonBadge, IonSkeletonText,
    IonSelect, IonSelectOption, IonItem, IonLabel,
    IonHeader, IonToolbar, IonTitle, IonContent,
  ],
  templateUrl: './reglamento-firmas.html',
  styleUrl: './reglamento-firmas.css',
})
export class ReglamentoFirmas implements OnInit {
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);

  reglamentos = signal<Reglamento[]>([]);
  firmas = signal<FirmaReglamento[]>([]);
  loading = signal(true);
  selectedReglamentoId = signal<number | null>(null);
  filtroEstado = signal<string>('');

  constructor() {
    addIcons({ searchOutline, closeCircleOutline, checkmarkCircleOutline, timeOutline, alertCircleOutline, documentTextOutline, arrowBackOutline });
  }

  ngOnInit(): void {
    this.loadReglamentos();
    this.loadFirmas();
  }

  loadReglamentos(): void {
    this.api.getReglamentos().subscribe({
      next: (data) => this.reglamentos.set(data),
    });
  }

  loadFirmas(): void {
    this.loading.set(true);
    this.api.getFirmas(
      this.selectedReglamentoId() ?? undefined,
      undefined,
      this.filtroEstado() || undefined,
    ).subscribe({
      next: (data) => {
        this.firmas.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Error al cargar firmas', 'danger');
      },
    });
  }

  filteredFirmas = computed(() => {
    const estado = this.filtroEstado();
    if (!estado) return this.firmas();
    return this.firmas().filter((f) => f.estado === estado);
  });

  onReglamentoChange(event: any): void {
    this.selectedReglamentoId.set(event.detail.value ?? null);
    this.loadFirmas();
  }

  onEstadoChange(event: any): void {
    this.filtroEstado.set(event.detail.value ?? '');
    this.loadFirmas();
  }

  estadoColor(estado: string): string {
    switch (estado) {
      case 'firmado': return 'success';
      case 'expirado': return 'danger';
      default: return 'warning';
    }
  }

  estadoIcon(estado: string): string {
    switch (estado) {
      case 'firmado': return 'checkmark-circle-outline';
      case 'expirado': return 'alert-circle-outline';
      default: return 'time-outline';
    }
  }

  abrirPdf(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message, duration: 3000, color, position: 'top',
    });
    await toast.present();
  }
}
