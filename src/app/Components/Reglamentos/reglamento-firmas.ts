import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonIcon, IonSkeletonText,
  IonSelect, IonSelectOption,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, timeOutline, alertCircleOutline,
  documentTextOutline, chevronBackOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { FirmaReglamento, Reglamento } from '../../Models/reglamentos';

@Component({
  selector: 'app-reglamento-firmas',
  imports: [
    FormsModule, DatePipe, TitleCasePipe,
    IonButton, IonIcon, IonSkeletonText,
    IonSelect, IonSelectOption,
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
  page = signal(1);
  readonly pageSize = 8;

  constructor() {
    addIcons({ checkmarkCircleOutline, timeOutline, alertCircleOutline, documentTextOutline, chevronBackOutline, chevronForwardOutline });
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

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredFirmas().length / this.pageSize)));

  pagedFirmas = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredFirmas().slice(start, start + this.pageSize);
  });

  onReglamentoChange(event: any): void {
    this.selectedReglamentoId.set(event.detail.value ?? null);
    this.page.set(1);
    this.loadFirmas();
  }

  onEstadoChange(event: any): void {
    this.filtroEstado.set(event.detail.value ?? '');
    this.page.set(1);
    this.loadFirmas();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
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
