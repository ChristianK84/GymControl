import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonIcon, IonButton, IonInput, IonSkeletonText, IonBadge,
  ToastController, AlertController,
} from '@ionic/angular/standalone';
import { ApiService } from '../../Services/api-service';
import { Asistencia } from '../../Models/asistencias';
import { Maestro } from '../../Models/maestros';
import { Alumno } from '../../Models/alumnos';
import { addIcons } from 'ionicons';
import {
  addOutline, searchOutline, closeCircleOutline,
  chevronBackOutline, chevronForwardOutline,
  pencilOutline, checkmarkOutline, closeOutline,
  trashOutline, warningOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-asistencias',
  imports: [FormsModule, IonIcon, IonButton, IonInput, IonSkeletonText, IonBadge],
  templateUrl: './asistencias.html',
  styleUrl: './asistencias.css',
})
export class Asistencias implements OnInit {
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  asistencias = signal<Asistencia[]>([]);
  maestros = signal<Maestro[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  maestroFilter = signal<number | null>(null);
  tipoFilter = signal<'todas' | 'asistio' | 'falta'>('todas');
  filterFechaDesde = '';
  filterFechaHasta = '';
  page = signal(1);
  readonly pageSize = 8;

  editingId = signal<number | null>(null);
  editAsistio = false;
  editNotas = '';
  editMaestroId: number | null = null;

  constructor() {
    addIcons({
      addOutline, searchOutline, closeCircleOutline,
      chevronBackOutline, chevronForwardOutline,
      pencilOutline, checkmarkOutline, closeOutline,
      trashOutline, warningOutline,
    });
  }

  ngOnInit(): void {
    this.loadAsistencias();
    this.api.getMaestros().subscribe({
      next: (data) => this.maestros.set(data),
    });
  }

  private loadAsistencias(): void {
    this.loading.set(true);
    const filters: Record<string, string | number> = {};
    if (this.filterFechaDesde) filters['fecha_desde'] = this.filterFechaDesde;
    if (this.filterFechaHasta) filters['fecha_hasta'] = this.filterFechaHasta;

    this.api.getAsistencias(filters as any).subscribe({
      next: (data) => {
        this.asistencias.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  maestroNombre(id: number): string {
    const m = this.maestros().find(x => x.id === id);
    return m ? `${m.nombre} ${m.apellido_paterno.charAt(0)}.` : `ID #${id}`;
  }

  fechaHora(fecha: string): { fecha: string; hora: string } {
    const d = new Date(fecha);
    return {
      fecha: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  iniciales(nombre: string): string {
    return nombre.trim().split(' ').map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  filtered = computed(() => {
    let list = this.asistencias();
    const term = this.searchTerm().toLowerCase().trim();
    const maestroId = this.maestroFilter();
    const tipo = this.tipoFilter();

    if (term) {
      list = list.filter(a =>
        a.alumno?.nombrecompleto?.toLowerCase().includes(term) ||
        a.alumno?.apellido_paterno?.toLowerCase().includes(term) ||
        (a.notas ?? '').toLowerCase().includes(term),
      );
    }
    if (maestroId !== null) {
      list = list.filter(a => a.maestro_id === maestroId);
    }
    if (tipo === 'asistio') list = list.filter(a => a.asistio);
    if (tipo === 'falta') list = list.filter(a => !a.asistio);

    return list;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  onMaestroChange(value: string): void {
    this.maestroFilter.set(value === '' ? null : +value);
    this.page.set(1);
  }

  onTipoChange(value: string): void {
    this.tipoFilter.set(value as any);
    this.page.set(1);
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadAsistencias();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.maestroFilter.set(null);
    this.tipoFilter.set('todas');
    this.filterFechaDesde = '';
    this.filterFechaHasta = '';
    this.page.set(1);
    this.loadAsistencias();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  startEdit(asis: Asistencia): void {
    this.editingId.set(asis.id);
    this.editAsistio = asis.asistio;
    this.editNotas = asis.notas ?? '';
    this.editMaestroId = asis.maestro_id;
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(asis: Asistencia): void {
    this.api.updateAsistencia(asis.id, {
      asistio: this.editAsistio,
      notas: this.editNotas || null,
      maestro_id: this.editMaestroId ?? undefined,
    }).subscribe({
      next: () => {
        this.editingId.set(null);
        this.loadAsistencias();
        this.showToast('Asistencia actualizada', 'success');
      },
      error: () => this.showToast('Error al actualizar', 'danger'),
    });
  }

  async deleteAsistencia(asis: Asistencia): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Asistencia',
      message: `¿Eliminar el registro de ${asis.alumno?.nombrecompleto ?? 'asistencia'} del día ${asis.fecha}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          cssClass: 'alert-delete-btn',
          handler: () => {
            this.api.deleteAsistencia(asis.id).subscribe({
              next: () => {
                this.loadAsistencias();
                this.showToast('Asistencia eliminada', 'success');
              },
              error: () => this.showToast('Error al eliminar', 'danger'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const icons: Record<string, string> = { success: 'checkmark-circle', danger: 'close-circle' };
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'top',
      icon: icons[color], cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
