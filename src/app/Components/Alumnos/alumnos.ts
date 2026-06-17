import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonButton, IonInput, IonSelect, IonSelectOption, IonSkeletonText, IonBadge, ToastController, ModalController } from '@ionic/angular/standalone';
import { ApiService } from '../../Services/api-service';
import { SessionService } from '../../Services/session.service';
import { Alumno } from '../../Models/alumnos';
import { Maestro } from '../../Models/maestros';
import { AlumnoFormModal } from './alumno-form-modal';
import { AlumnosCumpleaniosModal } from './alumnos-cumpleanios-modal';
import { addIcons } from 'ionicons';
import {
  addOutline, searchOutline, closeCircleOutline,
  chevronBackOutline, chevronForwardOutline, giftOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-alumnos',
  imports: [FormsModule, IonIcon, IonButton, IonInput, IonSelect, IonSelectOption, IonSkeletonText, IonBadge],
  templateUrl: './alumnos.html',
  styleUrl: './alumnos.css',
})
export class Alumnos implements OnInit {
  private api = inject(ApiService);
  private session = inject(SessionService);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private router = inject(Router);

  private readonly user = this.session.getUser();
  readonly isMaestro = this.user?.role_id === 2;

  allAlumnos = signal<Alumno[]>([]);
  maestros = signal<Maestro[]>([]);
  ultimaAsistencia = signal<Map<number, string>>(new Map());
  loading = signal(true);
  searchTerm = signal('');
  ramaFilter = signal('');
  maestroFilter = signal<number | null>(null);
  page = signal(1);
  readonly pageSize = 8;

  constructor() {
    addIcons({ addOutline, searchOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline, giftOutline });
  }

  ngOnInit(): void {
    const miId = this.isMaestro ? this.session.getMaestroId() : null;
    if (this.isMaestro && !miId) {
      this.allAlumnos.set([]);
      this.tryFinishLoading();
      this.tryFinishLoading();
      this.loading.set(false);
      return;
    }
    this.api.getAlumnos(false, miId).subscribe({
      next: (data) => this.allAlumnos.set(data),
      error: () => this.tryFinishLoading(),
      complete: () => this.tryFinishLoading(),
    });
    if (!this.isMaestro) {
      this.api.getMaestros().subscribe({
        next: (data) => this.maestros.set(data),
        error: () => this.tryFinishLoading(),
        complete: () => this.tryFinishLoading(),
      });
    } else {
      this.tryFinishLoading();
    }
    this.loadAsistencias();
  }

  private pendingLoads = 3;
  private tryFinishLoading(): void {
    this.pendingLoads--;
    if (this.pendingLoads <= 0) {
      this.loading.set(false);
    }
  }

  private loadAsistencias(): void {
    this.api.getAsistencias().subscribe({
      next: (data) => {
        const map = new Map<number, string>();
        for (const a of data) {
          const current = map.get(a.alumno_id);
          if (!current || a.fecha > current) {
            map.set(a.alumno_id, a.fecha);
          }
        }
        this.ultimaAsistencia.set(map);
      },
      error: () => this.tryFinishLoading(),
      complete: () => this.tryFinishLoading(),
    });
  }

  maestroNombre(maestroId: number): string {
    if (this.isMaestro) return this.user?.full_name ?? `ID #${maestroId}`;
    const m = this.maestros().find((x) => x.id === maestroId);
    if (!m) return `ID #${maestroId}`;
    return m.nombre;
  }

  maestroApellido(maestroId: number): string {
    if (this.isMaestro) return '';
    const m = this.maestros().find((x) => x.id === maestroId);
    return m ? m.apellido_paterno : '';
  }

  edad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let e = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
    return e;
  }

  iniciales(nombre: string): string {
    return nombre.trim().split(' ').map((p) => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  asistenciaStr(alumnoId: number): string {
    const fecha = this.ultimaAsistencia().get(alumnoId);
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  filtered = computed(() => {
    let list = this.allAlumnos();
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      list = list.filter(
        (a) =>
          a.nombrecompleto.toLowerCase().includes(term) ||
          a.apellido_paterno.toLowerCase().includes(term) ||
          (a.apellido_materno ?? '').toLowerCase().includes(term),
      );
    }
    if (this.ramaFilter()) {
      list = list.filter((a) => a.rama === this.ramaFilter());
    }
    if (this.maestroFilter()) {
      list = list.filter((a) => a.maestro_id === this.maestroFilter());
    }
    return list;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  pagedAlumnos = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  onRamaChange(value: string): void {
    this.ramaFilter.set(value);
    this.page.set(1);
  }

  onMaestroChange(value: number | null): void {
    this.maestroFilter.set(value);
    this.page.set(1);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.ramaFilter.set('');
    this.maestroFilter.set(null);
    this.page.set(1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  viewProfile(alumno: Alumno): void {
    this.router.navigate(['/dashboard/alumnos', alumno.id]);
  }

  async addAlumno(): Promise<void> {
    const miId = this.isMaestro ? this.session.getMaestroId() : null;
    const modal = await this.modalCtrl.create({
      component: AlumnoFormModal,
      componentProps: {
        maestros: this.maestros(),
        maestroVinculado: miId,
      },
    });
    await modal.present();
    const { role } = await modal.onDidDismiss();
    if (role === 'saved') {
      this.api.getAlumnos(false, miId).subscribe({
        next: (data) => this.allAlumnos.set(data),
      });
      this.showToast('Alumno creado con éxito', 'success');
    }
  }

  async verCumpleanios(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AlumnosCumpleaniosModal,
    });
    await modal.present();
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const icons: Record<string, string> = { success: 'checkmark-circle', danger: 'close-circle' };
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'top',
      icon: icons[color],
      cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
