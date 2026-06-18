import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonIcon, IonSkeletonText, IonSelect, IonSelectOption,
  IonInput,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, warningOutline, fileTrayOutline, addOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline, checkmarkCircleOutline, alertCircleOutline, searchOutline, mailOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Membresia } from '../../Models/membresias';
import { MembresiaFormModal } from './membresia-form-modal';
import { MembresiaImpagasModal } from './membresia-impagas-modal';

const ESTADO_LABELS: Record<number, { label: string; css: string }> = {
  1: { label: 'Activa', css: 'activa' },
  2: { label: 'Vencida', css: 'vencida' },
  3: { label: 'Cancelada', css: 'cancelada' },
};

@Component({
  selector: 'app-membresias',
  imports: [
    FormsModule,
    IonButton, IonIcon, IonSkeletonText, IonSelect, IonSelectOption,
    IonInput,
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
  searchTerm = signal('');

  constructor() {
    addIcons({ createOutline, warningOutline, fileTrayOutline, addOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline, checkmarkCircleOutline, alertCircleOutline, searchOutline, mailOutline });
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

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.allMembresias();
    return this.allMembresias().filter(m =>
      m.alumno?.nombrecompleto?.toLowerCase().includes(term) ||
      m.alumno?.apellido_paterno?.toLowerCase().includes(term) ||
      m.alumno?.apellido_materno?.toLowerCase().includes(term)
    );
  });

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
    this.searchTerm.set('');
    this.page.set(1);
    this.loadMembresias();
  }

  getEstadoLabel(estadoId: number): { label: string; css: string } {
    return ESTADO_LABELS[estadoId] ?? { label: 'Desconocido', css: '' };
  }

  getVigenciaLabel(m: Membresia): { text: string; css: string } {
    if (m.estado_id === 3) return { text: '—', css: 'cancelada' };
    const fecha = new Date(m.fecha_vencimiento);
    const text = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vence = new Date(m.fecha_vencimiento);
    vence.setHours(0, 0, 0, 0);
    const diff = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (m.estado_id === 2 || diff < 0) return { text, css: 'vencida' };
    if (diff === 0) return { text, css: 'warn' };
    return { text, css: 'ok' };
  }

  async addMembresia(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: MembresiaFormModal,
    });
    await modal.present();
    const { role } = await modal.onDidDismiss();
    if (role === 'saved') {
      this.loadMembresias();
      this.showToast('Membresía creada correctamente');
    }
  }

  async editMembresia(membresia: Membresia, event: Event): Promise<void> {
    event.stopPropagation();
    const modal = await this.modalCtrl.create({
      component: MembresiaFormModal,
      componentProps: { membresia },
    });
    await modal.present();
    const { role } = await modal.onDidDismiss();
    if (role === 'saved') {
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

  reenviarRecibo(membresia: Membresia, event: Event): void {
    event.stopPropagation();
    this.api.reenviarReciboMembresia(membresia.id).subscribe({
      next: (res) => this.showToast(res.message),
      error: (err) => this.showToast(err.error?.detail ?? 'Error al enviar recibo', 'danger'),
    });
  }

  async verImpagas(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: MembresiaImpagasModal,
    });
    await modal.present();
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
