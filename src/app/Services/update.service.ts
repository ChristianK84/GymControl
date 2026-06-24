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

  async checkForUpdate(): Promise<void> {
    try {
      const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
      await CapacitorUpdater.notifyAppReady();
    } catch {
    }

    if (!Capacitor.isNativePlatform()) {
      return;
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

      const modal = await this.modalCtrl.create({
        component: OtaUpdateModal,
        componentProps: { currentVersion, latestVersion: latest },
      });
      await modal.present();
    } catch {
    }
  }
}
