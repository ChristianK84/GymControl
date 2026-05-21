import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonIcon, ToastController, ModalController } from '@ionic/angular/standalone';
import { ApiService } from '../../Services/api-service';
import { Alumno } from '../../Models/alumnos';
import { Maestro } from '../../Models/maestros';
import { AlumnoFormModal } from './alumno-form-modal';
import { addIcons } from 'ionicons';
import {
  addOutline, searchOutline, closeCircleOutline,
  chevronBackOutline, chevronForwardOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-alumnos',
  imports: [FormsModule, IonIcon],
  templateUrl: './alumnos.html',
  styleUrl: './alumnos.css',
})
export class Alumnos implements OnInit {
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private router = inject(Router);

  allAlumnos = signal<Alumno[]>([]);
  maestros = signal<Maestro[]>([]);
  ultimaAsistencia = signal<Map<number, string>>(new Map());
  loading = signal(true);
  searchTerm = signal('');
  ramaFilter = signal('');
  page = signal(1);
  readonly pageSize = 8;

  constructor() {
    addIcons({ addOutline, searchOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit(): void {
    this.api.getAlumnos().subscribe({
      next: (data) => this.allAlumnos.set(data),
      complete: () => this.tryFinishLoading(),
    });
    this.api.getMaestros().subscribe({
      next: (data) => this.maestros.set(data),
      complete: () => this.tryFinishLoading(),
    });
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
      complete: () => this.tryFinishLoading(),
    });
  }

  maestroNombre(maestroId: number): string {
    const m = this.maestros().find((x) => x.id === maestroId);
    if (!m) return `ID #${maestroId}`;
    return m.nombre;
  }

  maestroApellido(maestroId: number): string {
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

  clearFilters(): void {
    this.searchTerm.set('');
    this.ramaFilter.set('');
    this.page.set(1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  viewProfile(alumno: Alumno): void {
    this.router.navigate(['/dashboard/alumnos', alumno.id]);
  }

  async addAlumno(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AlumnoFormModal,
      componentProps: { maestros: this.maestros() },
    });
    await modal.present();
    const { role } = await modal.onDidDismiss();
    if (role === 'saved') {
      this.api.getAlumnos().subscribe({
        next: (data) => this.allAlumnos.set(data),
      });
      this.showToast('Alumno creado con éxito', 'success');
    }
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
