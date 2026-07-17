import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFooter, IonSpinner, IonItem, IonLabel,
  IonCheckbox, IonInput,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, linkOutline, searchOutline, closeCircleOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Alumno } from '../../Models/alumnos';

@Component({
  selector: 'app-generar-links-modal',
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonIcon, IonFooter, IonSpinner, IonItem, IonLabel,
    IonCheckbox, IonInput,
  ],
  templateUrl: './generar-links-modal.html',
  styleUrl: './generar-links-modal.css',
})
export class GenerarLinksModal {
  private modalCtrl = inject(ModalController);
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);

  reglamentoId!: number;
  alumnos = signal<Alumno[]>([]);
  loading = signal(true);
  selectedIds = signal<Set<number>>(new Set());
  enviando = signal(false);
  searchTerm = signal('');

  constructor() {
    addIcons({ closeOutline, linkOutline, searchOutline, closeCircleOutline });
  }

  ionViewWillEnter(): void {
    this.api.getAlumnos(false).subscribe({
      next: (data) => {
        this.alumnos.set(data.filter((a) => a.is_active && a.tutor));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Error al cargar alumnos', 'danger');
        this.modalCtrl.dismiss(null, 'cancel');
      },
    });
  }

  filteredAlumnos = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.alumnos();
    return this.alumnos().filter(
      (a) =>
        a.nombrecompleto.toLowerCase().includes(term) ||
        a.apellido_paterno.toLowerCase().includes(term),
    );
  });

  allSelected = computed(() => {
    return this.selectedIds().size === this.filteredAlumnos().length && this.filteredAlumnos().length > 0;
  });

  toggleAll(): void {
    const filtered = this.filteredAlumnos();
    const allCurrentlySelected = this.filteredAlumnos().every((a) => this.selectedIds().has(a.id));
    const set = new Set(this.selectedIds());
    if (allCurrentlySelected) {
      for (const a of filtered) set.delete(a.id);
    } else {
      for (const a of filtered) set.add(a.id);
    }
    this.selectedIds.set(set);
  }

  toggleAlumno(id: number): void {
    const set = new Set(this.selectedIds());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.selectedIds.set(set);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async generar(): Promise<void> {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) {
      this.showToast('Selecciona al menos un alumno', 'danger');
      return;
    }

    this.enviando.set(true);
    this.api.generarLinks({ reglamento_id: this.reglamentoId, alumno_ids: ids }).subscribe({
      next: (res) => {
        this.enviando.set(false);
        this.showToast(`${res.enviados} de ${res.total} links enviados`, 'success');
        this.modalCtrl.dismiss(res, 'saved');
      },
      error: () => {
        this.enviando.set(false);
        this.showToast('Error al generar links', 'danger');
      },
    });
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message, duration: 3000, color, position: 'top',
    });
    await toast.present();
  }
}
