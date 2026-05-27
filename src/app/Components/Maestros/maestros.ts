import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonButton, IonInput, IonSelect, IonSelectOption, IonSkeletonText, IonBadge, ToastController, ModalController } from '@ionic/angular/standalone';
import { ApiService } from '../../Services/api-service';
import { Maestro } from '../../Models/maestros';
import { MaestroFormModal } from './maestro-form-modal';
import { addIcons } from 'ionicons';
import {
  addOutline, searchOutline, closeCircleOutline,
  chevronBackOutline, chevronForwardOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-maestros',
  imports: [FormsModule, IonIcon, IonButton, IonInput, IonSkeletonText, IonBadge],
  templateUrl: './maestros.html',
  styleUrl: './maestros.css',
})
export class Maestros implements OnInit {
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private router = inject(Router);

  allMaestros = signal<Maestro[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  page = signal(1);
  readonly pageSize = 8;

  constructor() {
    addIcons({ addOutline, searchOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit(): void {
    this.loadMaestros();
  }

  private loadMaestros(): void {
    this.api.getMaestros().subscribe({
      next: (data) => {
        this.allMaestros.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  iniciales(nombre: string): string {
    return nombre.trim().split(' ').map((p) => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  edad(fechaNacimiento: string | null): string {
    if (!fechaNacimiento) return '—';
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let e = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
    return `${e} años`;
  }

  filtered = computed(() => {
    let list = this.allMaestros();
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      list = list.filter(
        (m) =>
          m.nombre.toLowerCase().includes(term) ||
          m.apellido_paterno.toLowerCase().includes(term) ||
          (m.apellido_materno ?? '').toLowerCase().includes(term),
      );
    }
    return list;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  pagedMaestros = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  viewProfile(maestro: Maestro): void {
    this.router.navigate(['/dashboard/maestros', maestro.id]);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.page.set(1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  async addMaestro(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: MaestroFormModal,
    });
    await modal.present();
    const { role } = await modal.onDidDismiss();
    if (role === 'saved') {
      this.loadMaestros();
      this.showToast('Maestro creado con éxito', 'success');
    }
  }

  async editMaestro(maestro: Maestro): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: MaestroFormModal,
      componentProps: { maestro },
    });
    await modal.present();
    const { role } = await modal.onDidDismiss();
    if (role === 'saved') {
      this.loadMaestros();
      this.showToast('Maestro actualizado con éxito', 'success');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const icons: Record<string, string> = { success: 'checkmark-circle', danger: 'close-circle' };
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'top',
      icon: icons[color],
      cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
