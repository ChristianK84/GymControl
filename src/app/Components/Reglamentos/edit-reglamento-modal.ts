import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFooter, IonSpinner,
  IonInput, IonItem, IonLabel, IonToggle,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, cloudUploadOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../Services/api-service';
import { Reglamento } from '../../Models/reglamentos';

const CLOUDINARY_URL = environment.cloudinary.autoUploadUrl;
const UPLOAD_PRESET = environment.cloudinary.pdfPreset;

@Component({
  selector: 'app-edit-reglamento-modal',
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonIcon, IonFooter, IonSpinner,
    IonInput, IonItem, IonLabel, IonToggle,
  ],
  templateUrl: './edit-reglamento-modal.html',
  styleUrl: './edit-reglamento-modal.css',
})
export class EditReglamentoModal {
  private modalCtrl = inject(ModalController);
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);

  private _reglamento?: Reglamento;
  get reglamento(): Reglamento | undefined {
    return this._reglamento;
  }
  set reglamento(value: Reglamento | undefined) {
    this._reglamento = value;
    if (value) {
      this.titulo = value.titulo;
      this.descripcion = value.descripcion || '';
      this.version = value.version;
      this.isActive = value.is_active;
    }
  }

  titulo = '';
  descripcion = '';
  version = '';
  isActive = true;
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
    if (!this.titulo.trim() || !this.version.trim()) {
      this.showToast('Título y versión son obligatorios', 'danger');
      return;
    }

    this.uploading.set(true);

    try {
      if (!this._reglamento) return;

      let urlPdf = this._reglamento.url_pdf_cloudinary;
      let publicId = undefined;

      if (this.selectedFile) {
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('upload_preset', UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_URL, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Error al subir PDF');
        const data = await res.json();
        urlPdf = data.secure_url as string;
        publicId = data.public_id as string;
      }

      this.api.updateReglamento(this._reglamento.id, {
        titulo: this.titulo.trim(),
        descripcion: this.descripcion.trim() || undefined,
        version: this.version.trim(),
        is_active: this.isActive,
        ...(publicId ? { url_pdf_cloudinary: urlPdf, cloudinary_public_id: publicId } : {}),
      }).subscribe({
        next: (updated) => this.modalCtrl.dismiss(updated, 'saved'),
        error: () => {
          this.uploading.set(false);
          this.showToast('Error al guardar cambios', 'danger');
        },
      });
    } catch {
      this.uploading.set(false);
      this.showToast('Error al subir el PDF', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message, duration: 3000, color, position: 'top',
    });
    await toast.present();
  }
}
