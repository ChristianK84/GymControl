import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFooter, IonSelect, IonSelectOption,
  IonItem, IonLabel, IonTextarea, IonAvatar, IonSpinner,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { Asistencia } from '../../Models/asistencias';
import { Alumno } from '../../Models/alumnos';
import { Maestro } from '../../Models/maestros';
import { ApiService } from '../../Services/api-service';

@Component({
  selector: 'app-asistencia-edit-modal',
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonIcon, IonFooter, IonSelect, IonSelectOption,
    IonItem, IonLabel, IonTextarea, IonAvatar, IonSpinner,
  ],
  templateUrl: './asistencia-edit-modal.html',
  styleUrl: './asistencia-edit-modal.css',
})
export class AsistenciaEditModal implements OnInit {
  @Input() asistencia?: Asistencia;
  @Input() maestros: Maestro[] = [];
  @Input() selectedAlumno?: Alumno;
  @Input() defaultMaestroId?: number;

  private modalCtrl = inject(ModalController);
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);

  get isEdit(): boolean {
    return !!this.asistencia;
  }

  editAsistio = true;
  editNotas = '';
  editMaestroId: number | null = null;
  saving = false;

  constructor() {
    addIcons({ closeOutline });
  }

  ngOnInit(): void {
    if (this.isEdit) {
      this.editAsistio = this.asistencia!.asistio;
      this.editNotas = this.asistencia!.notas ?? '';
      this.editMaestroId = this.asistencia!.maestro_id;
    } else {
      this.editAsistio = true;
      this.editNotas = '';
      this.editMaestroId = this.defaultMaestroId ?? null;
    }
  }

  get alumnoNombre(): string {
    if (this.isEdit) {
      return this.asistencia!.alumno?.nombrecompleto ?? 'ID #' + this.asistencia!.alumno_id;
    }
    return this.selectedAlumno?.nombrecompleto ?? '';
  }

  get alumnoApellidos(): string {
    if (this.isEdit) {
      const a = this.asistencia!.alumno;
      return a ? `${a.apellido_paterno} ${a.apellido_materno ?? ''}` : '';
    }
    const a = this.selectedAlumno;
    return a ? `${a.apellido_paterno} ${a.apellido_materno ?? ''}` : '';
  }

  get alumnoIniciales(): string {
    const name = this.isEdit
      ? (this.asistencia!.alumno?.nombrecompleto ?? '?')
      : (this.selectedAlumno?.nombrecompleto ?? '?');
    return name.trim().split(' ').map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  private now = new Date();

  get fechaActual(): string {
    return this.now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  get horaActual(): string {
    return this.now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  get maestroNombre(): string {
    if (this.editMaestroId == null) return 'Sin asignar';
    const m = this.maestros.find(x => x.id === this.editMaestroId);
    return m ? `${m.nombre} ${m.apellido_paterno}` : `ID #${this.editMaestroId}`;
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.saving = true;

    if (this.isEdit) {
      this.api.updateAsistencia(this.asistencia!.id, {
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
    } else {
      this.api.createAsistencia({
        alumno_id: this.selectedAlumno!.id,
        maestro_id: this.editMaestroId ?? undefined,
        fecha: new Date().toISOString(),
        asistio: this.editAsistio,
        notas: this.editNotas || null,
      }).subscribe({
        next: () => {
          this.saving = false;
          this.modalCtrl.dismiss(true, 'saved');
        },
        error: () => {
          this.saving = false;
          this.showToast('Error al registrar la asistencia', 'danger');
        },
      });
    }
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
