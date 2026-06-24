import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { OtaUpdateModal } from '../Components/OtaUpdate/ota-update-modal';

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private http = inject(HttpClient);
  private modalCtrl = inject(ModalController);

  async checkForUpdate(): Promise<{ needsUpdate: boolean; currentVersion: string; latestVersion: { version: string; version_code: number; bundle_url: string } } | null> {
    try {
      const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
      await CapacitorUpdater.notifyAppReady();
    } catch {
    }

    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const baseUrl = environment.apiUrl.replace(/\/+$/, '');
      const latest = await firstValueFrom(
        this.http.get<{ version: string; version_code: number; bundle_url: string }>(
          `${baseUrl}/app/version/android`
        )
      );

      const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
      const current = await CapacitorUpdater.current();
      const currentVersion = current.bundle?.version?.trim() || 'builtin';

      const installed = typeof localStorage !== 'undefined' ? localStorage.getItem('ota_installed') : null;
      const isSame = currentVersion === latest.version ||
        (currentVersion === 'builtin' && installed === latest.version);

      return { needsUpdate: !isSame, currentVersion, latestVersion: latest };
    } catch {
      return null;
    }
  }

  async presentUpdateModal(currentVersion: string, latestVersion: { version: string; version_code: number; bundle_url: string }): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: OtaUpdateModal,
      componentProps: { currentVersion, latestVersion },
    });
    await modal.present();
  }
}
