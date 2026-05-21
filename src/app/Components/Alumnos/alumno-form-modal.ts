import { Component, inject, Input, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFooter, IonSpinner, ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, cloudUploadOutline, cameraOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Alumno } from '../../Models/alumnos';
import { Maestro } from '../../Models/maestros';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dyvqspnz7/image/upload';
const UPLOAD_PRESET = 'gymcontrol_upload';

@Component({
  selector: 'app-alumno-form-modal',
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonIcon, IonFooter, IonSpinner,
  ],
  templateUrl: './alumno-form-modal.html',
  styleUrl: './alumno-form-modal.css',
})
export class AlumnoFormModal implements OnInit {
  @Input() alumno?: Alumno;
  @Input() maestros: Maestro[] = [];

  private modalCtrl = inject(ModalController);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private toastCtrl = inject(ToastController);

  get isEdit(): boolean {
    return !!this.alumno;
  }

  // Alumno fields
  nombrecompleto = '';
  apellidoPaterno = '';
  apellidoMaterno = '';
  rama = '';
  fechaNacimiento = '';
  maestroId: number | undefined = undefined;
  fechaInscripcion = '';

  // Photo
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  currentPhotoUrl: string | null = null;
  uploading = signal(false);

  // Tutor
  tutorNombre = '';
  tutorApellidoP = '';
  tutorApellidoM = '';
  tutorTelefono = '';
  tutorEmail = '';

  // Contacto emergencia
  contactoNombre = '';
  contactoApellidoP = '';
  contactoApellidoM = '';
  contactoTelefono = '';

  // Ficha médica
  tipoSangre = '';
  alergias = '';
  medicamentos = '';
  condicionesMedicas = '';
  nss = '';

  createdAt = '';
  errors: Record<string, string> = {};

  constructor() {
    addIcons({ closeOutline, cloudUploadOutline, cameraOutline });
  }

  ngOnInit(): void {
    this.fechaInscripcion = new Date().toISOString().split('T')[0];

    if (this.alumno) {
      this.nombrecompleto = this.alumno.nombrecompleto;
      this.apellidoPaterno = this.alumno.apellido_paterno;
      this.apellidoMaterno = this.alumno.apellido_materno ?? '';
      this.rama = this.alumno.rama;
      this.fechaNacimiento = this.alumno.fecha_nacimiento;
      this.maestroId = this.alumno.maestro_id;
      this.fechaInscripcion = this.alumno.fecha_inscripcion;
      this.currentPhotoUrl = this.alumno.fotografia ?? null;

      if (this.alumno.tutor) {
        this.tutorNombre = this.alumno.tutor.nombre;
        this.tutorApellidoP = this.alumno.tutor.apellido_paterno;
        this.tutorApellidoM = this.alumno.tutor.apellido_materno ?? '';
        this.tutorTelefono = this.alumno.tutor.telefono;
        this.tutorEmail = this.alumno.tutor.email;
      }
      if (this.alumno.contacto_emergencia) {
        this.contactoNombre = this.alumno.contacto_emergencia.nombre;
        this.contactoApellidoP = this.alumno.contacto_emergencia.apellido_paterno;
        this.contactoApellidoM = this.alumno.contacto_emergencia.apellido_materno ?? '';
        this.contactoTelefono = this.alumno.contacto_emergencia.telefono;
      }
      if (this.alumno.ficha_medica) {
        this.tipoSangre = this.alumno.ficha_medica.tipo_sangre ?? '';
        this.alergias = this.alumno.ficha_medica.alergias ?? '';
        this.medicamentos = this.alumno.ficha_medica.medicamentos ?? '';
        this.condicionesMedicas = this.alumno.ficha_medica.condiciones_medicas ?? '';
        this.nss = this.alumno.ficha_medica.nss ?? '';
      }
      this.createdAt = new DatePipe('es-MX').transform(
        this.alumno.created_at, "d 'de' MMMM 'del' yyyy",
      )!;
    }
    this.cdr.detectChanges();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

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
    this.currentPhotoUrl = null;
  }

  private async uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Error al subir la imagen');
    }

    const data = await res.json();
    return data.secure_url as string;
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  private validate(): boolean {
    this.errors = {};
    if (!this.nombrecompleto.trim()) this.errors['nombrecompleto'] = 'Requerido';
    if (!this.apellidoPaterno.trim()) this.errors['apellidoPaterno'] = 'Requerido';
    if (!this.rama) this.errors['rama'] = 'Seleccione una rama';
    if (!this.fechaNacimiento) this.errors['fechaNacimiento'] = 'Requerida';
    if (this.maestroId == null) this.errors['maestroId'] = 'Seleccione un entrenador';
    if (!this.tipoSangre) this.errors['tipoSangre'] = 'Seleccione un tipo de sangre';
    if (!this.isEdit) {
      if (!this.tutorNombre.trim()) this.errors['tutorNombre'] = 'Requerido';
      if (!this.tutorApellidoP.trim()) this.errors['tutorApellidoP'] = 'Requerido';
      if (!this.tutorTelefono.trim()) this.errors['tutorTelefono'] = 'Requerido';
      if (!this.contactoNombre.trim()) this.errors['contactoNombre'] = 'Requerido';
      if (!this.contactoApellidoP.trim()) this.errors['contactoApellidoP'] = 'Requerido';
      if (!this.contactoTelefono.trim()) this.errors['contactoTelefono'] = 'Requerido';
    }
    return Object.keys(this.errors).length === 0;
  }

  async save(): Promise<void> {
    if (!this.validate()) return;

    this.uploading.set(true);

    let fotoUrl: string | null | undefined;

    if (this.selectedFile) {
      try {
        fotoUrl = await this.uploadToCloudinary(this.selectedFile);
      } catch {
        this.errors['photo'] = 'Error al subir la foto';
        this.showToast('Error al subir la imagen a Cloudinary', 'danger');
        this.uploading.set(false);
        return;
      }
    } else if (this.photoPreview === null && this.currentPhotoUrl === null) {
      fotoUrl = null;
    }

    if (this.isEdit) {
      const body: Parameters<typeof this.api.updateAlumno>[1] = {
        nombrecompleto: this.nombrecompleto || undefined,
        apellido_paterno: this.apellidoPaterno || undefined,
        apellido_materno: this.apellidoMaterno || null,
        rama: this.rama || undefined,
        fecha_nacimiento: this.fechaNacimiento || undefined,
        maestro_id: this.maestroId,
        fecha_inscripcion: this.fechaInscripcion || undefined,
        ...(fotoUrl !== undefined ? { fotografia: fotoUrl } : {}),
        ...(this.tutorChanged() && {
          tutor: {
            nombre: this.tutorNombre || undefined,
            apellido_paterno: this.tutorApellidoP || undefined,
            apellido_materno: this.tutorApellidoM || null,
            telefono: this.tutorTelefono || undefined,
            email: this.tutorEmail || undefined,
          },
        }),
        ...(this.contactoChanged() && {
          contacto_emergencia: {
            nombre: this.contactoNombre || undefined,
            apellido_paterno: this.contactoApellidoP || undefined,
            apellido_materno: this.contactoApellidoM || null,
            telefono: this.contactoTelefono || undefined,
          },
        }),
        ...(this.fichaChanged() && {
          ficha_medica: {
            tipo_sangre: this.tipoSangre || null,
            alergias: this.alergias || null,
            medicamentos: this.medicamentos || null,
            condiciones_medicas: this.condicionesMedicas || null,
            nss: this.nss || null,
          },
        }),
      };

      this.api.updateAlumno(this.alumno!.id, body).subscribe({
        next: (updated) => this.modalCtrl.dismiss(updated, 'saved'),
        error: (err) => {
          this.uploading.set(false);
          this.showToast(
            err.status === 401 ? 'Sesión expirada, inicia de nuevo' : 'Error al guardar los cambios',
            'danger',
          );
        },
      });
    } else {
      this.api.createAlumno({
        nombrecompleto: this.nombrecompleto,
        apellido_paterno: this.apellidoPaterno,
        apellido_materno: this.apellidoMaterno || null,
        rama: this.rama,
        fecha_nacimiento: this.fechaNacimiento,
        maestro_id: this.maestroId!,
        fecha_inscripcion: this.fechaInscripcion,
        fotografia: fotoUrl ?? null,
        tutor: {
          nombre: this.tutorNombre,
          apellido_paterno: this.tutorApellidoP,
          apellido_materno: this.tutorApellidoM || null,
          telefono: this.tutorTelefono,
          email: this.tutorEmail,
        },
        contacto_emergencia: {
          nombre: this.contactoNombre,
          apellido_paterno: this.contactoApellidoP,
          apellido_materno: this.contactoApellidoM || null,
          telefono: this.contactoTelefono,
        },
        ficha_medica: {
          tipo_sangre: this.tipoSangre || null,
          alergias: this.alergias || null,
          medicamentos: this.medicamentos || null,
          condiciones_medicas: this.condicionesMedicas || null,
          nss: this.nss || null,
        },
      }).subscribe({
        next: (created) => this.modalCtrl.dismiss(created, 'saved'),
        error: (err) => {
          this.uploading.set(false);
          this.showToast(
            err.status === 401 ? 'Sesión expirada, inicia de nuevo' : 'Error al crear el alumno',
            'danger',
          );
        },
      });
    }
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const icons: Record<string, string> = { success: 'checkmark-circle', danger: 'close-circle' };
    const toast = await this.toastCtrl.create({
      message, duration: 3000, color, position: 'top',
      icon: icons[color],
      cssClass: 'custom-toast',
    });
    await toast.present();
  }
  private tutorChanged(): boolean {
    return this.tutorNombre !== '' || this.tutorApellidoP !== '' || this.tutorTelefono !== '' || this.tutorEmail !== '';
  }

  private contactoChanged(): boolean {
    return this.contactoNombre !== '' || this.contactoApellidoP !== '' || this.contactoTelefono !== '';
  }

  private fichaChanged(): boolean {
    return this.tipoSangre !== '' || this.alergias !== '' || this.medicamentos !== '' || this.condicionesMedicas !== '' || this.nss !== '';
  }
}
