import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFooter, IonSpinner,
  IonInput, IonItem, IonLabel,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, cloudUploadOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../Services/api-service';

const CLOUDINARY_URL = environment.cloudinary.autoUploadUrl;
const UPLOAD_PRESET = environment.cloudinary.pdfPreset;

@Component({
  selector: 'app-upload-reglamento-modal',
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonIcon, IonFooter, IonSpinner,
    IonInput, IonItem, IonLabel,
  ],
  templateUrl: './upload-reglamento-modal.html',
  styleUrl: './upload-reglamento-modal.css',
})
export class UploadReglamentoModal {
  private modalCtrl = inject(ModalController);
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);

  titulo = '';
  descripcion = '';
  version = '';
  selectedFile: File | null = null;
  uploading = signal(false);

  constructor() {
    addIcons({ closeOutline, cloudUploadOutline });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async save(): Promise<void> {
    if (!this.titulo.trim() || !this.version.trim() || !this.selectedFile) {
      this.showToast('Complete todos los campos', 'danger');
      return;
    }

    this.uploading.set(true);

    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('upload_preset', UPLOAD_PRESET);

      const res = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Error al subir PDF');
      }

      const data = await res.json();

      this.api.createReglamento({
        titulo: this.titulo.trim(),
        descripcion: this.descripcion.trim() || undefined,
        version: this.version.trim(),
        url_pdf_cloudinary: data.secure_url as string,
        cloudinary_public_id: data.public_id as string,
      }).subscribe({
        next: (created) => this.modalCtrl.dismiss(created, 'saved'),
        error: (err) => {
          this.uploading.set(false);
          this.showToast('Error al guardar reglamento', 'danger');
        },
      });
    } catch {
      this.uploading.set(false);
      this.showToast('Error al subir el PDF a Cloudinary', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message, duration: 3000, color, position: 'top',
    });
    await toast.present();
  }
}
