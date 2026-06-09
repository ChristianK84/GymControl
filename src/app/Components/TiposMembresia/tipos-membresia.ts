import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonIcon, IonBadge, IonSkeletonText, IonInput,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, searchOutline, closeCircleOutline, fileTrayOutline, addOutline, trashOutline, chevronBackOutline, chevronForwardOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { TipoMembresia } from '../../Models/membresias';
import { TipoMembresiaFormModal } from './tipo-membresia-form-modal';

@Component({
  selector: 'app-tipos-membresia',
  imports: [
    FormsModule,
    IonButton, IonIcon, IonBadge, IonSkeletonText, IonInput,
  ],
  templateUrl: './tipos-membresia.html',
  styleUrl: './tipos-membresia.css',
})
export class TiposMembresia implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  allTipos = signal<TipoMembresia[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  page = signal(1);
  readonly pageSize = 8;

  constructor() {
    addIcons({ createOutline, searchOutline, closeCircleOutline, fileTrayOutline, addOutline, trashOutline, chevronBackOutline, chevronForwardOutline, checkmarkCircleOutline, alertCircleOutline });
  }

  ngOnInit(): void {
    this.loadTipos();
  }

  loadTipos(): void {
    this.loading.set(true);
    this.api.getTiposMembresia().subscribe({
      next: (data) => {
        this.allTipos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.allTipos.set([]);
        this.loading.set(false);
        this.showToast('Error al cargar los tipos de membresía', 'danger');
      },
    });
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.allTipos();
    return this.allTipos().filter((t) =>
      t.nombre.toLowerCase().includes(term) ||
      (t.descripcion && t.descripcion.toLowerCase().includes(term)),
    );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  pagedTipos = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  onSearch(value: string | null): void {
    this.searchTerm.set(value ?? '');
    this.page.set(1);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.page.set(1);
  }

  async addTipo(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: TipoMembresiaFormModal,
      cssClass: 'modal-content',
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.role === 'saved') {
      this.loadTipos();
      this.showToast('Tipo de membresía creado correctamente');
    }
  }

  async editTipo(tipo: TipoMembresia, event: Event): Promise<void> {
    event.stopPropagation();
    const modal = await this.modalCtrl.create({
      component: TipoMembresiaFormModal,
      cssClass: 'modal-content',
      componentProps: { tipo },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.role === 'saved') {
      this.loadTipos();
      this.showToast('Tipo de membresía actualizado correctamente');
    }
  }

  async deleteTipo(tipo: TipoMembresia, event: Event): Promise<void> {
    event.stopPropagation();
    this.api.deleteTipoMembresia(tipo.id).subscribe({
      next: () => {
        this.loadTipos();
        this.showToast('Tipo de membresía eliminado');
      },
      error: () => this.showToast('Error al eliminar', 'danger'),
    });
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
