import { Component, inject, Input, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFooter, IonSpinner,
  IonInput, IonItem, IonLabel, IonAvatar, IonToggle,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { closeOutline, cloudUploadOutline, cameraOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Maestro } from '../../Models/maestros';

const CLOUDINARY_URL = environment.cloudinary.uploadUrl;
const UPLOAD_PRESET = environment.cloudinary.maestroPreset;

@Component({
  selector: 'app-maestro-form-modal',
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonIcon, IonFooter, IonSpinner,
    IonInput, IonItem, IonLabel, IonAvatar, IonToggle,
  ],
  templateUrl: './maestro-form-modal.html',
  styleUrl: './maestro-form-modal.css',
})
export class MaestroFormModal implements OnInit {
  @Input() maestro?: Maestro;

  private modalCtrl = inject(ModalController);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private toastCtrl = inject(ToastController);

  get isEdit(): boolean {
    return !!this.maestro;
  }

  nombre = '';
  apellidoPaterno = '';
  apellidoMaterno = '';
  telefono = '';
  fechaNacimiento = '';
  isActive = true;

  selectedFile: File | null = null;
  photoPreview: string | null = null;
  currentPhotoUrl: string | null = null;
  uploading = signal(false);

  createdAt = '';
  errors: Record<string, string> = {};

  constructor() {
    addIcons({ closeOutline, cloudUploadOutline, cameraOutline });
  }

  ngOnInit(): void {
    if (this.maestro) {
      this.nombre = this.maestro.nombre;
      this.apellidoPaterno = this.maestro.apellido_paterno;
      this.apellidoMaterno = this.maestro.apellido_materno ?? '';
      this.telefono = this.maestro.telefono ?? '';
      this.fechaNacimiento = this.maestro.fecha_nacimiento ?? '';
      this.isActive = this.maestro.is_active;
      this.currentPhotoUrl = this.maestro.foto ?? null;
      this.createdAt = new DatePipe('es-MX').transform(
        this.maestro.created_at, "d 'de' MMMM 'del' yyyy",
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
    if (!this.nombre.trim()) this.errors['nombre'] = 'Requerido';
    if (!this.apellidoPaterno.trim()) this.errors['apellidoPaterno'] = 'Requerido';
    if (!this.isEdit) {
      // Solo requerir campos adicionales para creación
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

    const body = {
      nombre: this.nombre,
      apellido_paterno: this.apellidoPaterno,
      apellido_materno: this.apellidoMaterno || null,
      telefono: this.telefono || null,
      fecha_nacimiento: this.fechaNacimiento || null,
      ...(fotoUrl !== undefined ? { foto: fotoUrl } : {}),
      is_active: this.isActive,
    };

    if (this.isEdit) {
      this.api.updateMaestro(this.maestro!.id, body).subscribe({
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
      this.api.createMaestro(body).subscribe({
        next: (created) => this.modalCtrl.dismiss(created, 'saved'),
        error: (err) => {
          this.uploading.set(false);
          this.showToast(
            err.status === 401 ? 'Sesión expirada, inicia de nuevo' : 'Error al crear el maestro',
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
}
