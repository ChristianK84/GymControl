import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  IonIcon, IonSpinner, IonSegment, IonSegmentButton, IonLabel,
  IonSelect, IonSelectOption, ToastController,
  IonButton, IonInput, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonBadge,
} from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../Services/api-service';
import { Maestro } from '../../Models/maestros';
import { Alumno } from '../../Models/alumnos';
import { Asistencia } from '../../Models/asistencias';
import { addIcons } from 'ionicons';
import {
  personOutline, callOutline, mailOutline, calendarOutline,
  createOutline, checkmarkOutline, closeOutline, cameraOutline,
  cloudUploadOutline, arrowBackOutline, peopleOutline,
  checkmarkCircleOutline, schoolOutline, ribbonOutline,
  barChartOutline, starOutline, shieldCheckmarkOutline,
  searchOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline,
  pencilOutline, timeOutline,
} from 'ionicons/icons';

const CLOUDINARY_URL = environment.cloudinary.uploadUrl;
const UPLOAD_PRESET = environment.cloudinary.maestroPreset;

@Component({
  selector: 'app-perfil-maestro',
  imports: [
    FormsModule, IonIcon, IonSpinner, IonSegment, IonSegmentButton,
    IonLabel, IonSelect, IonSelectOption, IonButton, IonInput,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonBadge,
  ],
  templateUrl: './perfil-maestro.html',
  styleUrl: './perfil-maestro.css',
})
export class PerfilMaestro implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  maestro = signal<Maestro | null>(null);
  alumnos = signal<Alumno[]>([]);
  asistencias = signal<Asistencia[]>([]);
  loading = signal(true);
  editing = signal(false);
  saving = signal(false);
  activeTab = signal('info');

  // Stats
  alumnosActivos = computed(() => this.alumnos().filter(a => a.is_active).length);
  asistenciasMes = computed(() => {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    return this.asistencias().filter(a => a.fecha >= inicioMes).length;
  });

  // Photo
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  removePhotoFlag = false;

  // Edit form
  editNombre = ''; editApellidoP = ''; editApellidoM = '';
  editTelefono = ''; editFechaNac = ''; editIsActive = true;
  editCreatedAt = '';

  // Alumnos tab
  alumnoSearch = signal('');
  alumnoPage = signal(1);
  readonly alumnoPageSize = 6;

  // Asistencias tab
  asisSearch = signal('');
  asisPage = signal(1);
  readonly asisPageSize = 8;
  filterFechaDesde = '';
  filterFechaHasta = '';
  editingAsistenciaId = signal<number | null>(null);
  editAsistio = false; editAsisNotas = ''; editAsisMaestroId: number | null = null;

  constructor() {
    addIcons({
      personOutline, callOutline, mailOutline, calendarOutline,
      createOutline, checkmarkOutline, closeOutline, cameraOutline,
      cloudUploadOutline, arrowBackOutline, peopleOutline,
      checkmarkCircleOutline, schoolOutline, ribbonOutline,
      barChartOutline, starOutline, shieldCheckmarkOutline,
      searchOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline,
      pencilOutline, timeOutline,
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getMaestro(id).subscribe({
      next: (data) => {
        this.maestro.set(data);
        this.loading.set(false);
        this.loadAlumnos();
        this.loadAsistencias();
      },
      error: () => this.loading.set(false),
    });
  }

  private loadAlumnos(): void {
    const m = this.maestro();
    if (!m) return;
    this.api.getAlumnos(false, m.id).subscribe({
      next: (data) => this.alumnos.set(data),
    });
  }

  private loadAsistencias(): void {
    const m = this.maestro();
    if (!m) return;
    const filters: { maestro_id: number; fecha_desde?: string; fecha_hasta?: string } = { maestro_id: m.id };
    if (this.filterFechaDesde) filters.fecha_desde = this.filterFechaDesde;
    if (this.filterFechaHasta) filters.fecha_hasta = this.filterFechaHasta;
    this.api.getAsistencias(filters).subscribe({
      next: (data) => this.asistencias.set(data),
    });
  }

  // ── Helpers ──

  edad(fecha: string | null): string {
    if (!fecha) return '—';
    const hoy = new Date();
    const nac = new Date(fecha);
    let e = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) e--;
    return `${e} años`;
  }

  fechaFormato(fecha: string): string {
    const fechaOk = fecha.includes('T') ? fecha : fecha + 'T00:00:00';
    return new Date(fechaOk).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  iniciales(nombre: string): string {
    return nombre.trim().split(' ').map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  ramaColor(rama: string): string {
    return rama === 'Varonil' ? '#2563eb' : '#e30613';
  }

  // ── Edit ──

  startEditing(): void {
    const m = this.maestro()!;
    this.editNombre = m.nombre;
    this.editApellidoP = m.apellido_paterno;
    this.editApellidoM = m.apellido_materno ?? '';
    this.editTelefono = m.telefono ?? '';
    this.editFechaNac = m.fecha_nacimiento ?? '';
    this.editIsActive = m.is_active;
    this.editCreatedAt = new DatePipe('es-MX').transform(m.created_at, "d 'de' MMMM 'del' yyyy")!;
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.selectedFile = null;
    this.photoPreview = null;
    this.removePhotoFlag = false;
    this.editing.set(false);
  }

  async saveChanges(): Promise<void> {
    const m = this.maestro()!;
    this.saving.set(true);

    let fotoUrl: string | null | undefined;
    if (this.selectedFile) {
      try {
        fotoUrl = await this.uploadToCloudinary(this.selectedFile);
      } catch {
        this.showToast('Error al subir la foto', 'danger');
        this.saving.set(false);
        return;
      }
    } else if (this.removePhotoFlag) {
      fotoUrl = null;
    }

    this.api.updateMaestro(m.id, {
      nombre: this.editNombre || undefined,
      apellido_paterno: this.editApellidoP || undefined,
      apellido_materno: this.editApellidoM || null,
      telefono: this.editTelefono || null,
      fecha_nacimiento: this.editFechaNac || null,
      is_active: this.editIsActive,
      ...(fotoUrl !== undefined ? { foto: fotoUrl } : {}),
    }).subscribe({
      next: (updated) => {
        this.maestro.set(updated);
        this.selectedFile = null;
        this.photoPreview = null;
        this.removePhotoFlag = false;
        this.editing.set(false);
        this.saving.set(false);
        this.showToast('Perfil actualizado con éxito', 'success');
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Error al guardar', 'danger');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.removePhotoFlag = false;
      const reader = new FileReader();
      reader.onload = () => { this.photoPreview = reader.result as string; this.cdr.detectChanges(); };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removePhoto(): void {
    this.selectedFile = null;
    this.photoPreview = null;
    this.removePhotoFlag = true;
  }

  private async uploadToCloudinary(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.secure_url;
  }

  // ── Alumnos tab ──

  filteredAlumnos = computed(() => {
    let list = this.alumnos();
    const term = this.alumnoSearch().toLowerCase().trim();
    if (term) {
      list = list.filter(a =>
        a.nombrecompleto.toLowerCase().includes(term) ||
        a.apellido_paterno.toLowerCase().includes(term) ||
        (a.apellido_materno ?? '').toLowerCase().includes(term),
      );
    }
    return list;
  });

  alumnoTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredAlumnos().length / this.alumnoPageSize)));

  pagedAlumnos = computed(() => {
    const start = (this.alumnoPage() - 1) * this.alumnoPageSize;
    return this.filteredAlumnos().slice(start, start + this.alumnoPageSize);
  });

  // ── Asistencias tab ──

  filteredAsistencias = computed(() => {
    let list = this.asistencias();
    const term = this.asisSearch().toLowerCase().trim();
    if (term) {
      list = list.filter(a =>
        a.alumno?.nombrecompleto?.toLowerCase().includes(term) ||
        (a.notas ?? '').toLowerCase().includes(term),
      );
    }
    return list;
  });

  asisTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredAsistencias().length / this.asisPageSize)));

  pagedAsistencias = computed(() => {
    const start = (this.asisPage() - 1) * this.asisPageSize;
    return this.filteredAsistencias().slice(start, start + this.asisPageSize);
  });

  fechaHora(fecha: string): { fecha: string; hora: string } {
    const d = new Date(fecha);
    return {
      fecha: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // ── Navigation ──

  onTabChange(value: unknown): void {
    this.activeTab.set(String(value ?? 'info'));
  }

  applyAsisFilters(): void {
    this.asisPage.set(1);
    this.loadAsistencias();
  }

  clearAsisFilters(): void {
    this.asisSearch.set('');
    this.filterFechaDesde = '';
    this.filterFechaHasta = '';
    this.asisPage.set(1);
    this.loadAsistencias();
  }

  // ── Edit Asistencia inline ──

  startEditAsistencia(asis: Asistencia): void {
    this.editingAsistenciaId.set(asis.id);
    this.editAsistio = asis.asistio;
    this.editAsisNotas = asis.notas ?? '';
    this.editAsisMaestroId = asis.maestro_id;
  }

  cancelEditAsistencia(): void {
    this.editingAsistenciaId.set(null);
  }

  saveAsistencia(asis: Asistencia): void {
    this.api.updateAsistencia(asis.id, {
      asistio: this.editAsistio,
      notas: this.editAsisNotas || null,
      maestro_id: this.editAsisMaestroId ?? undefined,
    }).subscribe({
      next: () => {
        this.editingAsistenciaId.set(null);
        this.loadAsistencias();
        this.showToast('Asistencia actualizada', 'success');
      },
      error: () => this.showToast('Error al actualizar', 'danger'),
    });
  }

  goToAlumnoPage(p: number): void { if (p >= 1 && p <= this.alumnoTotalPages()) this.alumnoPage.set(p); }
  goToAsisPage(p: number): void { if (p >= 1 && p <= this.asisTotalPages()) this.asisPage.set(p); }

  // ── Toast ──

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const icons: Record<string, string> = { success: 'checkmark-circle', danger: 'close-circle' };
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'top',
      icon: icons[color], cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
