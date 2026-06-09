import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonIcon, IonSkeletonText, IonSelect, IonSelectOption,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, warningOutline, fileTrayOutline, addOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Membresia } from '../../Models/membresias';
import { MembresiaFormModal } from './membresia-form-modal';
import { MembresiaImpagasModal } from './membresia-impagas-modal';

const ESTADO_LABELS: Record<number, { label: string; css: string }> = {
  1: { label: 'Activa', css: 'activa' },
  2: { label: 'Vencida', css: 'vencida' },
  3: { label: 'Cancelada', css: 'cancelada' },
  4: { label: 'Pendiente', css: 'pendiente' },
};

@Component({
  selector: 'app-membresias',
  imports: [
    FormsModule,
    IonButton, IonIcon, IonSkeletonText, IonSelect, IonSelectOption,
  ],
  templateUrl: './membresias.html',
  styleUrl: './membresias.css',
})
export class Membresias implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  allMembresias = signal<Membresia[]>([]);
  loading = signal(true);
  page = signal(1);
  readonly pageSize = 8;

  filterEstado = signal<number | null>(null);
  filterPagado = signal<boolean | null>(null);
  filterVencidas = signal(false);

  constructor() {
    addIcons({ createOutline, warningOutline, fileTrayOutline, addOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline, checkmarkCircleOutline, alertCircleOutline });
  }

  ngOnInit(): void {
    this.loadMembresias();
  }

  loadMembresias(): void {
    this.loading.set(true);
    const filters: Record<string, unknown> = {};
    const estado = this.filterEstado();
    const pagado = this.filterPagado();
    if (estado) filters['estado_id'] = estado;
    if (pagado !== null) filters['pagado'] = pagado;
    if (this.filterVencidas()) filters['vencidas'] = true;

    this.api.getMembresias(Object.keys(filters).length ? filters as never : undefined).subscribe({
      next: (data) => {
        this.allMembresias.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.allMembresias.set([]);
        this.loading.set(false);
        this.showToast('Error al cargar membresías', 'danger');
      },
    });
  }

  filtered = computed(() => this.allMembresias());

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  pagedMembresias = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadMembresias();
  }

  clearFilters(): void {
    this.filterEstado.set(null);
    this.filterPagado.set(null);
    this.filterVencidas.set(false);
    this.page.set(1);
    this.loadMembresias();
  }

  getEstadoLabel(estadoId: number): { label: string; css: string } {
    return ESTADO_LABELS[estadoId] ?? { label: 'Desconocido', css: '' };
  }

  async addMembresia(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: MembresiaFormModal,
      cssClass: 'modal-content',
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.role === 'saved') {
      this.loadMembresias();
      this.showToast('Membresía creada correctamente');
    }
  }

  async editMembresia(membresia: Membresia, event: Event): Promise<void> {
    event.stopPropagation();
    const modal = await this.modalCtrl.create({
      component: MembresiaFormModal,
      cssClass: 'modal-content',
      componentProps: { membresia },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.role === 'saved') {
      this.loadMembresias();
      this.showToast('Membresía actualizada correctamente');
    }
  }

  async cancelarMembresia(membresia: Membresia, event: Event): Promise<void> {
    event.stopPropagation();
    this.api.deleteMembresia(membresia.id).subscribe({
      next: () => {
        this.loadMembresias();
        this.showToast('Membresía cancelada');
      },
      error: () => this.showToast('Error al cancelar', 'danger'),
    });
  }

  async verImpagas(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: MembresiaImpagasModal,
      cssClass: 'modal-content',
    });
    await modal.present();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatCurrency(value: number): string {
    return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
      icon: color === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline',
    });
    await toast.present();
  }
}
