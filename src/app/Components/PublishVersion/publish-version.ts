import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';

@Component({
  selector: 'app-publish-version',
  imports: [
    FormsModule,
    IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, IonTextarea,
  ],
  templateUrl: './publish-version.html',
  styleUrl: './publish-version.css',
})
export class PublishVersion {
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);

  platform = 'android';
  version = '';
  versionCode: number | null = null;
  bundleUrl = '';
  releaseNotes = '';

  errors: Record<string, string> = {};
  sending = signal(false);

  constructor() {
    addIcons({ cloudUploadOutline, checkmarkCircleOutline, alertCircleOutline });
  }

  validate(): boolean {
    this.errors = {};
    if (!this.version.trim()) this.errors['version'] = 'La versión es obligatoria';
    if (this.versionCode === null || this.versionCode < 1) this.errors['versionCode'] = 'Version code debe ser mayor a 0';
    if (!this.bundleUrl.trim()) this.errors['bundleUrl'] = 'La URL del bundle es obligatoria';
    return Object.keys(this.errors).length === 0;
  }

  publish(): void {
    if (!this.validate()) return;
    this.sending.set(true);

    this.api.publishAppVersion(this.platform, {
      version: this.version.trim(),
      version_code: this.versionCode!,
      bundle_url: this.bundleUrl.trim(),
      release_notes: this.releaseNotes.trim() || null,
    }).subscribe({
      next: () => {
        this.sending.set(false);
        this.showToast('Versión publicada exitosamente', 'success');
        this.resetForm();
      },
      error: (err) => {
        this.sending.set(false);
        const msg = err?.error?.detail || 'Error al publicar la versión';
        this.showToast(msg, 'danger');
      },
    });
  }

  private resetForm(): void {
    this.version = '';
    this.versionCode = null;
    this.bundleUrl = '';
    this.releaseNotes = '';
    this.errors = {};
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message, duration: 3000, color, position: 'bottom',
      icon: color === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline',
    });
    await toast.present();
  }
}
