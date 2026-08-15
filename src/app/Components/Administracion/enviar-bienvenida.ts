import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonIcon, IonButton, IonSkeletonText, IonSpinner, IonCheckbox,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline, checkmarkCircleOutline, closeCircleOutline,
  alertCircleOutline, searchOutline,
} from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Maestro } from '../../Models/maestros';

@Component({
  selector: 'app-enviar-bienvenida',
  imports: [
    FormsModule, IonIcon, IonButton, IonSkeletonText, IonSpinner, IonCheckbox,
  ],
  templateUrl: './enviar-bienvenida.html',
  styleUrl: './enviar-bienvenida.css',
})
export class EnviarBienvenida implements OnInit {
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);

  maestros = signal<Maestro[]>([]);
  loading = signal(true);
  sending = signal(false);
  selectedIds = signal<Set<number>>(new Set());
  searchTerm = signal('');
  resultado = signal<{ enviados: number; fallidos: { id: number; nombre: string; error: string }[] } | null>(null);

  constructor() {
    addIcons({ mailOutline, checkmarkCircleOutline, closeCircleOutline, alertCircleOutline, searchOutline });
  }

  ngOnInit(): void {
    this.loadMaestros();
  }

  loadMaestros(): void {
    this.loading.set(true);
    this.api.getMaestros(false, true).subscribe({
      next: (data) => {
        this.maestros.set(data.filter(m => m.email));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredMaestros = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.maestros();
    return this.maestros().filter(m =>
      m.nombre.toLowerCase().includes(term) ||
      m.apellido_paterno.toLowerCase().includes(term) ||
      (m.email ?? '').toLowerCase().includes(term)
    );
  });

  toggleSelection(id: number): void {
    const newSet = new Set(this.selectedIds());
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    this.selectedIds.set(newSet);
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleAll(): void {
    const ids = this.filteredMaestros().map(m => m.id);
    const allSelected = ids.every(id => this.selectedIds().has(id));
    const newSet = new Set(this.selectedIds());
    if (allSelected) {
      ids.forEach(id => newSet.delete(id));
    } else {
      ids.forEach(id => newSet.add(id));
    }
    this.selectedIds.set(newSet);
  }

  allSelected(): boolean {
    const ids = this.filteredMaestros().map(m => m.id);
    return ids.length > 0 && ids.every(id => this.selectedIds().has(id));
  }

  async send(): Promise<void> {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;

    this.sending.set(true);
    this.resultado.set(null);

    this.api.enviarBienvenida(ids).subscribe({
      next: (res) => {
        this.sending.set(false);
        this.resultado.set(res);
        this.selectedIds.set(new Set());
        this.showToast(
          `Enviados: ${res.enviados} | Fallidos: ${res.fallidos.length}`,
          res.fallidos.length === 0 ? 'success' : 'warning',
        );
        this.loadMaestros();
      },
      error: () => {
        this.sending.set(false);
        this.showToast('Error al enviar bienvenidas', 'danger');
      },
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const icons: Record<string, string> = { success: 'checkmark-circle', danger: 'close-circle', warning: 'alert-circle-outline' };
    const toast = await this.toastCtrl.create({
      message, duration: 4000, color, position: 'top',
      icon: icons[color], cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
