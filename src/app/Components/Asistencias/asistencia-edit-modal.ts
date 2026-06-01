import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFooter, IonSelect, IonSelectOption,
  IonItem, IonLabel, IonTextarea, ToastController,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkOutline } from 'ionicons/icons';
import { Asistencia } from '../../Models/asistencias';
import { Maestro } from '../../Models/maestros';
import { ApiService } from '../../Services/api-service';

@Component({
  selector: 'app-asistencia-edit-modal',
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonIcon, IonFooter, IonSelect, IonSelectOption,
    IonItem, IonLabel, IonTextarea,
  ],
  template: `
<ion-header>
  <ion-toolbar color="light">
    <ion-buttons slot="start">
      <ion-button (click)="dismiss()">
        <ion-icon name="close-outline" slot="icon-only"></ion-icon>
      </ion-button>
    </ion-buttons>
    <ion-title>Editar Asistencia</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding edit-modal-content">
  <div class="edit-field">
    <label class="edit-label">Alumno</label>
    <div class="alumno-display">
      <div class="alumno-avatar-fallback">{{ iniciales(asistencia.alumno?.nombrecompleto ?? '?') }}</div>
      <div>
        <div class="alumno-name">{{ asistencia.alumno?.nombrecompleto ?? 'ID #' + asistencia.alumno_id }}</div>
        @if (asistencia.alumno) {
          <div class="alumno-apellido">{{ asistencia.alumno.apellido_paterno }} {{ asistencia.alumno.apellido_materno ?? '' }}</div>
        }
      </div>
    </div>
  </div>

  <div class="edit-row">
    <div class="edit-field edit-field-half">
      <label class="edit-label">Fecha</label>
      <div class="edit-value">{{ fechaHora(asistencia.fecha).fecha }}</div>
    </div>
    <div class="edit-field edit-field-half">
      <label class="edit-label">Hora</label>
      <div class="edit-value">{{ fechaHora(asistencia.fecha).hora }}</div>
    </div>
  </div>

  <div class="edit-field">
    <label class="edit-label">Maestro</label>
    <ion-select class="edit-select" [(ngModel)]="editMaestroId" interface="popover">
      @for (m of maestros; track m.id) {
        <ion-select-option [value]="m.id">{{ m.nombre }} {{ m.apellido_paterno }}</ion-select-option>
      }
    </ion-select>
  </div>

  <div class="edit-field">
    <label class="edit-label">Estado</label>
    <ion-select class="edit-select" [(ngModel)]="editAsistio" interface="popover">
      <ion-select-option [value]="true">Asistió</ion-select-option>
      <ion-select-option [value]="false">Falta</ion-select-option>
    </ion-select>
  </div>

  <div class="edit-field">
    <label class="edit-label">Notas</label>
    <ion-textarea
      class="edit-textarea"
      [(ngModel)]="editNotas"
      placeholder="Agregar notas..."
      fill="outline"
      rows="3"
      auto-grow
    ></ion-textarea>
  </div>
</ion-content>

<ion-footer>
  <ion-toolbar class="edit-footer-toolbar">
    <ion-buttons slot="end">
      <ion-button fill="outline" (click)="dismiss()">Cancelar</ion-button>
      <ion-button fill="solid" color="primary" (click)="save()" [disabled]="saving">
        @if (saving) { Guardando... } @else { Guardar Cambios }
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-footer>
  `,
  styles: [`
.edit-modal-content { font-family: 'Inter', sans-serif; }
.edit-field { margin-bottom: 1rem; }
.edit-label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #5e3f3b; margin-bottom: 0.35rem; }
.edit-value { font-size: 0.9rem; color: #2a1714; font-weight: 500; }
.edit-row { display: flex; gap: 0.75rem; }
.edit-field-half { flex: 1; }
.edit-select { --border-color: #e5e2e1; --border-radius: 0.5rem; --background: #faf8f7; --placeholder-color: #936e69; font-family: 'Inter', sans-serif; font-size: 0.85rem; width: 100%; }
.edit-textarea { --border-color: #e5e2e1; --border-radius: 0.5rem; --background: #faf8f7; --color: #2a1714; font-family: 'Inter', sans-serif; font-size: 0.85rem; }
.edit-footer-toolbar { --padding-top: 0; --padding-bottom: 0; padding: 0.5rem 1rem; }
.alumno-display { display: flex; align-items: center; gap: 0.75rem; }
.alumno-avatar-fallback { width: 2.5rem; height: 2.5rem; min-width: 2.5rem; border-radius: 50%; background: #fedad5; color: #2a1714; font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.alumno-name { font-weight: 600; font-size: 0.9rem; }
.alumno-apellido { font-size: 0.75rem; color: #5e3f3b; }
  `],
})
export class AsistenciaEditModal {
  @Input() asistencia!: Asistencia;
  @Input() maestros: Maestro[] = [];

  private modalCtrl = inject(ModalController);
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);

  editAsistio = true;
  editNotas = '';
  editMaestroId: number | null = null;
  saving = false;

  constructor() {
    addIcons({ closeOutline, checkmarkOutline });
  }

  ngOnInit(): void {
    this.editAsistio = this.asistencia.asistio;
    this.editNotas = this.asistencia.notas ?? '';
    this.editMaestroId = this.asistencia.maestro_id;
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.saving = true;
    this.api.updateAsistencia(this.asistencia.id, {
      asistio: this.editAsistio,
      notas: this.editNotas || null,
      maestro_id: this.editMaestroId ?? undefined,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.modalCtrl.dismiss(true, 'saved');
      },
      error: () => {
        this.saving = false;
        this.showToast('Error al actualizar', 'danger');
      },
    });
  }

  fechaHora(fecha: string): { fecha: string; hora: string } {
    const d = new Date(fecha);
    return {
      fecha: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  iniciales(nombre: string): string {
    return nombre.trim().split(' ').map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const icons: Record<string, string> = { success: 'checkmark-circle', danger: 'close-circle' };
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'top',
      icon: icons[color], cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
