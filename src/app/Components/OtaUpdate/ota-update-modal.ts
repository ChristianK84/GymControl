import { Component, Input, signal, inject } from '@angular/core';
import { IonIcon, IonSpinner, IonButton, ModalController } from '@ionic/angular/standalone';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, closeCircleOutline, cloudDownloadOutline,
} from 'ionicons/icons';
import { APP_VERSION } from '../../version';

type OtaState = 'idle' | 'downloading' | 'installing' | 'done' | 'error';

@Component({
  selector: 'app-ota-update-modal',
  imports: [IonIcon, IonSpinner, IonButton],
  templateUrl: './ota-update-modal.html',
  styleUrl: './ota-update-modal.css',
})
export class OtaUpdateModal {
  @Input() currentVersion!: string;
  @Input() latestVersion!: { version: string; version_code: number; bundle_url: string };

  private modalCtrl = inject(ModalController);

  state = signal<OtaState>('idle');
  version = signal('');
  errorMsg = signal('');
  appVersion = APP_VERSION;

  updateNeeded = signal(false);

  constructor() {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, cloudDownloadOutline });
  }

  async ionViewDidEnter(): Promise<void> {
    const cv = this.currentVersion?.trim() || '';
    const lv = this.latestVersion.version.trim();
    const installed = typeof localStorage !== 'undefined' ? localStorage.getItem('ota_installed') : null;

    this.updateNeeded.set(
      !(cv === lv || cv === 'builtin' && installed === lv || cv === 'builtin' && this.appVersion.trim() === lv)
    );
  }

  async doUpdate(): Promise<void> {
    this.version.set(this.latestVersion.version);
    await new Promise((r) => setTimeout(r, 300));

    try {
      this.state.set('downloading');
      const bundle = await CapacitorUpdater.download({
        version: this.latestVersion.version,
        url: this.latestVersion.bundle_url,
      });

      this.state.set('installing');
      await CapacitorUpdater.set({ id: bundle.id });
      localStorage.setItem('ota_installed', this.latestVersion.version.trim());
      await new Promise((r) => setTimeout(r, 600));

      this.state.set('done');
      await new Promise((r) => setTimeout(r, 1500));
      await CapacitorUpdater.reload();
    } catch (err: any) {
      this.state.set('error');
      this.errorMsg.set(err?.message || err?.toString() || 'Error desconocido');
    }
  }

  dismiss(): void {
    this.modalCtrl.dismiss();
  }
}
