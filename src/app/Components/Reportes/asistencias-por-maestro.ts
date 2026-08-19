import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonIcon, IonSkeletonText, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barChartOutline, refreshOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Maestro } from '../../Models/maestros';
import { AsistenciasPorMaestroResponse } from '../../Models/reportes';

@Component({
  selector: 'app-asistencias-por-maestro',
  imports: [
    FormsModule,
    IonButton, IonIcon, IonSkeletonText,
  ],
  templateUrl: './asistencias-por-maestro.html',
  styleUrl: './asistencias-por-maestro.css',
})
export class AsistenciasPorMaestro implements OnInit {
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);

  loading = signal(true);
  response = signal<AsistenciasPorMaestroResponse | null>(null);

  fechaInicio = signal<string>('');
  fechaFin = signal<string>('');
  maestroId = signal<number | null>(null);

  maestros = signal<Maestro[]>([]);

  constructor() {
    addIcons({ barChartOutline, refreshOutline });
    const hoy = new Date();
    const desde = new Date();
    desde.setDate(hoy.getDate() - 56);
    this.fechaInicio.set(this.toInputDate(desde));
    this.fechaFin.set(this.toInputDate(hoy));
  }

  ngOnInit(): void {
    this.loadMaestros();
    this.loadReporte();
  }

  toInputDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  semanaLabel(iso: string): string {
    const parts = iso.split('-W');
    return parts.length === 2 ? `Sem ${parts[1]}` : iso;
  }

  setMaestroId(value: unknown): void {
    this.maestroId.set(value ? Number(value) : null);
  }

  totalMaestros = computed(() => this.response()?.maestros.length ?? 0);
  totalAsistencias = computed(() =>
    (this.response()?.maestros ?? []).reduce((acc, m) => acc + m.total_general, 0),
  );

  loadMaestros(): void {
    this.api.getMaestros(false, false).subscribe({
      next: (data) => this.maestros.set(data),
      error: () => this.maestros.set([]),
    });
  }

  aplicar(): void {
    this.loadReporte();
  }

  resetFiltros(): void {
    const hoy = new Date();
    const desde = new Date();
    desde.setDate(hoy.getDate() - 56);
    this.fechaInicio.set(this.toInputDate(desde));
    this.fechaFin.set(this.toInputDate(hoy));
    this.maestroId.set(null);
    this.loadReporte();
  }

  loadReporte(): void {
    this.loading.set(true);
    this.api.getAsistenciasPorMaestro({
      fecha_inicio: this.fechaInicio() || undefined,
      fecha_fin: this.fechaFin() || undefined,
      maestro_id: this.maestroId() ?? undefined,
    }).subscribe({
      next: (data) => {
        this.response.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.response.set(null);
        this.loading.set(false);
        this.showToast('Error al cargar el reporte', 'danger');
      },
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'primary' = 'primary') {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}
