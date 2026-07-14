import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFooter, IonSpinner, IonItem, IonLabel,
  IonCheckbox,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, linkOutline, peopleOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Alumno } from '../../Models/alumnos';

@Component({
  selector: 'app-generar-links-modal',
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonIcon, IonFooter, IonSpinner, IonItem, IonLabel,
    IonCheckbox,
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

  constructor() {
    addIcons({ closeOutline, linkOutline, peopleOutline });
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

  allSelected = computed(() => {
    return this.selectedIds().size === this.alumnos().length;
  });

  toggleAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.alumnos().map((a) => a.id)));
    }
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
