import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonItem, IonLabel, IonSelect, IonSelectOption,
  ModalController, ToastController, AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, trashOutline, createOutline, alertCircleOutline,
  checkmarkCircleOutline, filterOutline,
} from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Inscripcion } from '../../Models/inscripciones';
import { InscripcionFormModal } from './inscripcion-form-modal';

@Component({
  selector: 'app-inscripciones',
  imports: [
    FormsModule, DecimalPipe, DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonItem, IonLabel, IonSelect, IonSelectOption,
  ],
  templateUrl: './inscripciones.html',
  styleUrl: './inscripciones.css',
})
export class Inscripciones {
  private api = inject(ApiService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  inscripciones = signal<Inscripcion[]>([]);
  loading = signal(false);

  filterAnio: number | null = null;
  filterPagado: boolean | null = null;

  constructor() {
    addIcons({
      addOutline, trashOutline, createOutline, alertCircleOutline,
      checkmarkCircleOutline, filterOutline,
    });
  }

  ionViewWillEnter(): void {
    this.loadInscripciones();
  }

  loadInscripciones(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {};
    if (this.filterAnio) params['anio'] = this.filterAnio;
    if (this.filterPagado != null) params['pagado'] = this.filterPagado;
    this.api.getInscripciones(params).subscribe({
      next: (data) => {
        this.inscripciones.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Error al cargar inscripciones', 'danger');
      },
    });
  }

  async openForm(inscripcion?: Inscripcion): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: InscripcionFormModal,
      componentProps: inscripcion ? { inscripcion } : {},
    });
    await modal.present();
    const { role } = await modal.onDidDismiss();
    if (role === 'saved') {
      this.loadInscripciones();
      this.showToast(inscripcion ? 'Inscripción actualizada' : 'Inscripción creada', 'success');
    }
  }

  async deleteInscripcion(inscripcion: Inscripcion): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar inscripción',
      message: `¿Está seguro de eliminar la inscripción de ${inscripcion.alumno?.nombrecompleto} ${inscripcion.alumno?.apellido_paterno}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive',
          handler: () => {
            this.api.deleteInscripcion(inscripcion.id).subscribe({
              next: () => {
                this.loadInscripciones();
                this.showToast('Inscripción eliminada', 'success');
              },
              error: () => this.showToast('Error al eliminar inscripción', 'danger'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message, duration: 2500, position: 'bottom', color,
      icon: color === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline',
    });
    await toast.present();
  }
}
