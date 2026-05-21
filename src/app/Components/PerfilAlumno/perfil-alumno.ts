import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { ApiService } from '../../Services/api-service';
import { Alumno } from '../../Models/alumnos';
import { Maestro } from '../../Models/maestros';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, personOutline, medicalOutline,
  warningOutline, starOutline, callOutline, mailOutline,
  createOutline, checkmarkOutline, closeOutline, cameraOutline,
  cloudUploadOutline, receiptOutline, documentTextOutline,
  idCardOutline, peopleOutline, shieldCheckmarkOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-perfil-alumno',
  imports: [FormsModule, IonIcon, IonSpinner],
  templateUrl: './perfil-alumno.html',
  styleUrl: './perfil-alumno.css',
})
export class PerfilAlumno implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  alumno = signal<Alumno | null>(null);
  maestro = signal<Maestro | null>(null);
  allMaestros = signal<Maestro[]>([]);
  loading = signal(true);
  editing = signal(false);
  saving = signal(false);

  // Photo
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  removePhotoFlag = false;

  // Form fields
  editNombre = ''; editApellidoP = ''; editApellidoM = '';
  editFechaNac = ''; editRama = ''; editMaestroId: number | null = null;
  editFechaIns = ''; editTipoSangre = ''; editIsActive = true;
  editAlergias = ''; editMedicamentos = ''; editCondiciones = ''; editNss = '';
  editTutorNombre = ''; editTutorApellidoP = ''; editTutorApellidoM = '';
  editTutorTelefono = ''; editTutorEmail = '';
  editContactoNombre = ''; editContactoApellidoP = ''; editContactoApellidoM = '';
  editContactoTelefono = '';

  constructor() {
    addIcons({
      checkmarkCircleOutline, personOutline, medicalOutline,
      warningOutline, starOutline, callOutline, mailOutline,
      createOutline, checkmarkOutline, closeOutline, cameraOutline,
      cloudUploadOutline, receiptOutline, documentTextOutline,
      idCardOutline, peopleOutline, shieldCheckmarkOutline,
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getAlumno(id).subscribe({
      next: (data) => {
        this.alumno.set(data);
        if (data.maestro_id) {
          this.api.getMaestro(data.maestro_id).subscribe({
            next: (m) => this.maestro.set(m),
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.getMaestros().subscribe({
      next: (data) => this.allMaestros.set(data),
    });
  }

  edad(fecha: string): number {
    const hoy = new Date();
    const nac = new Date(fecha);
    let e = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
    return e;
  }

  fechaFormato(fecha: string): string {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  startEditing(): void {
    const a = this.alumno()!;
    this.editNombre = a.nombrecompleto;
    this.editApellidoP = a.apellido_paterno;
    this.editApellidoM = a.apellido_materno ?? '';
    this.editFechaNac = a.fecha_nacimiento;
    this.editRama = a.rama;
    this.editMaestroId = a.maestro_id;
    this.editFechaIns = a.fecha_inscripcion;
    this.editIsActive = a.is_active;
    this.editTipoSangre = a.ficha_medica?.tipo_sangre ?? '';
    this.editAlergias = a.ficha_medica?.alergias ?? '';
    this.editMedicamentos = a.ficha_medica?.medicamentos ?? '';
    this.editCondiciones = a.ficha_medica?.condiciones_medicas ?? '';
    this.editNss = a.ficha_medica?.nss ?? '';
    if (a.tutor) {
      this.editTutorNombre = a.tutor.nombre;
      this.editTutorApellidoP = a.tutor.apellido_paterno;
      this.editTutorApellidoM = a.tutor.apellido_materno ?? '';
      this.editTutorTelefono = a.tutor.telefono;
      this.editTutorEmail = a.tutor.email ?? '';
    }
    if (a.contacto_emergencia) {
      this.editContactoNombre = a.contacto_emergencia.nombre;
      this.editContactoApellidoP = a.contacto_emergencia.apellido_paterno;
      this.editContactoApellidoM = a.contacto_emergencia.apellido_materno ?? '';
      this.editContactoTelefono = a.contacto_emergencia.telefono;
    }
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.selectedFile = null;
    this.photoPreview = null;
    this.removePhotoFlag = false;
    this.editing.set(false);
  }

  async saveChanges(): Promise<void> {
    const a = this.alumno()!;
    this.saving.set(true);

    let fotoUrl: string | null | undefined;
    if (this.selectedFile) {
      try {
        fotoUrl = await this.uploadToCloudinary(this.selectedFile);
      } catch {
        this.showToast('Error al subir la foto', 'danger');
        this.saving.set(false);
        return;
      }
    } else if (this.removePhotoFlag) {
      fotoUrl = null;
    }

    this.api.updateAlumno(a.id, {
      nombrecompleto: this.editNombre || undefined,
      apellido_paterno: this.editApellidoP || undefined,
      apellido_materno: this.editApellidoM || null,
      rama: this.editRama || undefined,
      fecha_nacimiento: this.editFechaNac || undefined,
      maestro_id: this.editMaestroId ?? undefined,
      fecha_inscripcion: this.editFechaIns || undefined,
      is_active: this.editIsActive,
      ...(fotoUrl !== undefined ? { fotografia: fotoUrl } : {}),
      tutor: this.tutorChanged() ? {
        nombre: this.editTutorNombre || undefined,
        apellido_paterno: this.editTutorApellidoP || undefined,
        apellido_materno: this.editTutorApellidoM || null,
        telefono: this.editTutorTelefono || undefined,
        email: this.editTutorEmail || undefined,
      } : undefined,
      contacto_emergencia: this.contactoChanged() ? {
        nombre: this.editContactoNombre || undefined,
        apellido_paterno: this.editContactoApellidoP || undefined,
        apellido_materno: this.editContactoApellidoM || null,
        telefono: this.editContactoTelefono || undefined,
      } : undefined,
      ficha_medica: {
        tipo_sangre: this.editTipoSangre || null,
        alergias: this.editAlergias || null,
        medicamentos: this.editMedicamentos || null,
        condiciones_medicas: this.editCondiciones || null,
        nss: this.editNss || null,
      },
    }).subscribe({
      next: (updated) => {
        this.alumno.set(updated);
        this.selectedFile = null;
        this.photoPreview = null;
        this.removePhotoFlag = false;
        if (updated.maestro_id) {
          this.api.getMaestro(updated.maestro_id).subscribe({
            next: (m) => this.maestro.set(m),
          });
        } else {
          this.maestro.set(null);
        }
        this.editing.set(false);
        this.saving.set(false);
        this.showToast('Perfil actualizado con éxito', 'success');
      },
      error: (err) => {
        this.saving.set(false);
        this.showToast(err.status === 401 ? 'Sesión expirada' : 'Error al guardar', 'danger');
      },
    });
  }

  private tutorChanged(): boolean {
    return !!this.editTutorNombre || !!this.editTutorApellidoP || !!this.editTutorTelefono;
  }

  private contactoChanged(): boolean {
    return !!this.editContactoNombre || !!this.editContactoApellidoP || !!this.editContactoTelefono;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.removePhotoFlag = false;
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removePhoto(): void {
    this.selectedFile = null;
    this.photoPreview = null;
    this.removePhotoFlag = true;
  }

  private async uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'gymcontrol_upload');
    const res = await fetch('https://api.cloudinary.com/v1_1/dyvqspnz7/image/upload', {
      method: 'POST', body: formData,
    });
    if (!res.ok) throw new Error('Error al subir la imagen');
    const data = await res.json();
    return data.secure_url as string;
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const icons: Record<string, string> = { success: 'checkmark-circle', danger: 'close-circle' };
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'top',
      icon: icons[color],
      cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
