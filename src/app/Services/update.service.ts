import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface AppVersionResponse {
  version: string;
  version_code: number;
  bundle_url: string;
  release_notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  async checkForUpdate(): Promise<void> {
    try {
      await CapacitorUpdater.notifyAppReady();
    } catch {
      // Fallo notifyAppReady, continuar normal
    }

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const baseUrl = environment.apiUrl.replace(/\/+$/, '');
      const latest = await firstValueFrom(
        this.http.get<AppVersionResponse>(`${baseUrl}/app/version/android`)
      );

      const current = await CapacitorUpdater.current();
      if (current.bundle.version === latest.version) {
        return;
      }

      this.toastr.info('Descargando nueva versión...', 'GymControl');

      const bundle = await CapacitorUpdater.download({
        version: latest.version,
        url: latest.bundle_url,
      });

      await CapacitorUpdater.set(bundle);
    } catch {
      // Si falla la actualización, la app arranca normal
    }
  }
}
