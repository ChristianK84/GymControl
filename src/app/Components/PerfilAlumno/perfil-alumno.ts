import { Component, inject, signal, OnInit, computed, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonIcon, IonSpinner, IonSegment, IonSegmentButton, IonLabel,
  IonSelect, IonSelectOption, ToastController,
  IonButton, IonInput, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge,
  IonSkeletonText, IonAvatar, IonItem,
} from '@ionic/angular/standalone';
import { ApiService } from '../../Services/api-service';
import { Alumno } from '../../Models/alumnos';
import { Maestro } from '../../Models/maestros';
import { Asistencia } from '../../Models/asistencias';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, personOutline, medicalOutline,
  warningOutline, starOutline, callOutline, mailOutline,
  createOutline, checkmarkOutline, closeOutline, cameraOutline,
  cloudUploadOutline, receiptOutline, documentTextOutline,
  idCardOutline, peopleOutline, shieldCheckmarkOutline,
  pencilOutline, trashOutline, calendarOutline, timeOutline,
  searchOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline,
  arrowBackOutline, cardOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-perfil-alumno',
  imports: [FormsModule, IonIcon, IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonSelect, IonSelectOption, IonButton, IonInput, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonSkeletonText, IonAvatar, IonItem],
  templateUrl: './perfil-alumno.html',
  styleUrl: './perfil-alumno.css',
})
export class PerfilAlumno implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  alumno = signal<Alumno | null>(null);
  maestro = signal<Maestro | null>(null);
  allMaestros = signal<Maestro[]>([]);
  loading = signal(true);
  editing = signal(false);
  saving = signal(false);
  activeTab = signal('info');

  // Asistencias
  asistencias = signal<Asistencia[]>([]);
  loadingAsistencias = signal(false);
  asisPage = signal(1);
  readonly asisPageSize = 6;
  filterFechaDesde = '';
  filterFechaHasta = '';
  filterTipo = signal<'todas' | 'asistencia' | 'falta'>('todas');
  editingAsistenciaId = signal<number | null>(null);
  editAsistio = false; editAsisNotas = ''; editAsisMaestroId: number | null = null;

  // Photo
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  removePhotoFlag = false;

  // Form fields
  editNombre = ''; editApellidoP = ''; editApellidoM = '';
  editFechaNac = ''; editRama = ''; editMaestroId: number | null = null;
  editFechaIns = ''; editTipoSangre = ''; editIsActive = true;
  editAlergias = ''; editMedicamentos = ''; editCondiciones = ''; editNss = '';
  editTutorNombre = ''; editTutorApellidoP = ''; editTutorApellidoM = '';
  editTutorTelefono = ''; editTutorEmail = '';
  editContactoNombre = ''; editContactoApellidoP = ''; editContactoApellidoM = '';
  editContactoTelefono = '';

  constructor() {
    addIcons({
      checkmarkCircleOutline, personOutline, medicalOutline,
      warningOutline, starOutline, callOutline, mailOutline,
      createOutline, checkmarkOutline, closeOutline, cameraOutline,
      cloudUploadOutline, receiptOutline, documentTextOutline,
      idCardOutline, peopleOutline, shieldCheckmarkOutline,
      pencilOutline, trashOutline, calendarOutline, timeOutline,
      searchOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline,
      arrowBackOutline, cardOutline,
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getAlumno(id).subscribe({
      next: (data) => {
        this.alumno.set(data);
        if (data.maestro_id) {
          this.api.getMaestro(data.maestro_id).subscribe({
            next: (m) => this.maestro.set(m),
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.getMaestros().subscribe({
      next: (data) => this.allMaestros.set(data),
    });
  }

  edad(fecha: string): number {
    const hoy = new Date();
    const nac = new Date(fecha);
    let e = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
    return e;
  }

  fechaFormato(fecha: string): string {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  startEditing(): void {
    const a = this.alumno()!;
    this.editNombre = a.nombrecompleto;
    this.editApellidoP = a.apellido_paterno;
    this.editApellidoM = a.apellido_materno ?? '';
    this.editFechaNac = a.fecha_nacimiento;
    this.editRama = a.rama;
    this.editMaestroId = a.maestro_id;
    this.editFechaIns = a.fecha_inscripcion;
    this.editIsActive = a.is_active;
    this.editTipoSangre = a.ficha_medica?.tipo_sangre ?? '';
    this.editAlergias = a.ficha_medica?.alergias ?? '';
    this.editMedicamentos = a.ficha_medica?.medicamentos ?? '';
    this.editCondiciones = a.ficha_medica?.condiciones_medicas ?? '';
    this.editNss = a.ficha_medica?.nss ?? '';
    if (a.tutor) {
      this.editTutorNombre = a.tutor.nombre;
      this.editTutorApellidoP = a.tutor.apellido_paterno;
      this.editTutorApellidoM = a.tutor.apellido_materno ?? '';
      this.editTutorTelefono = a.tutor.telefono;
      this.editTutorEmail = a.tutor.email ?? '';
    }
    if (a.contacto_emergencia) {
      this.editContactoNombre = a.contacto_emergencia.nombre;
      this.editContactoApellidoP = a.contacto_emergencia.apellido_paterno;
      this.editContactoApellidoM = a.contacto_emergencia.apellido_materno ?? '';
      this.editContactoTelefono = a.contacto_emergencia.telefono;
    }
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.selectedFile = null;
    this.photoPreview = null;
    this.removePhotoFlag = false;
    this.editing.set(false);
  }

  async saveChanges(): Promise<void> {
    const a = this.alumno()!;
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

    this.api.updateAlumno(a.id, {
      nombrecompleto: this.editNombre || undefined,
      apellido_paterno: this.editApellidoP || undefined,
      apellido_materno: this.editApellidoM || null,
      rama: this.editRama || undefined,
      fecha_nacimiento: this.editFechaNac || undefined,
      maestro_id: this.editMaestroId ?? undefined,
      fecha_inscripcion: this.editFechaIns || undefined,
      is_active: this.editIsActive,
      ...(fotoUrl !== undefined ? { fotografia: fotoUrl } : {}),
      tutor: this.tutorChanged() ? {
        nombre: this.editTutorNombre || undefined,
        apellido_paterno: this.editTutorApellidoP || undefined,
        apellido_materno: this.editTutorApellidoM || null,
        telefono: this.editTutorTelefono || undefined,
        email: this.editTutorEmail || undefined,
      } : undefined,
      contacto_emergencia: this.contactoChanged() ? {
        nombre: this.editContactoNombre || undefined,
        apellido_paterno: this.editContactoApellidoP || undefined,
        apellido_materno: this.editContactoApellidoM || null,
        telefono: this.editContactoTelefono || undefined,
      } : undefined,
      ficha_medica: {
        tipo_sangre: this.editTipoSangre || null,
        alergias: this.editAlergias || null,
        medicamentos: this.editMedicamentos || null,
        condiciones_medicas: this.editCondiciones || null,
        nss: this.editNss || null,
      },
    }).subscribe({
      next: (updated) => {
        this.alumno.set(updated);
        this.selectedFile = null;
        this.photoPreview = null;
        this.removePhotoFlag = false;
        if (updated.maestro_id) {
          this.api.getMaestro(updated.maestro_id).subscribe({
            next: (m) => this.maestro.set(m),
          });
        } else {
          this.maestro.set(null);
        }
        this.editing.set(false);
        this.saving.set(false);
        this.showToast('Perfil actualizado con éxito', 'success');
      },
      error: (err) => {
        this.saving.set(false);
        this.showToast(err.status === 401 ? 'Sesión expirada' : 'Error al guardar', 'danger');
      },
    });
  }

  private tutorChanged(): boolean {
    return !!this.editTutorNombre || !!this.editTutorApellidoP || !!this.editTutorTelefono;
  }

  private contactoChanged(): boolean {
    return !!this.editContactoNombre || !!this.editContactoApellidoP || !!this.editContactoTelefono;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.removePhotoFlag = false;
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removePhoto(): void {
    this.selectedFile = null;
    this.photoPreview = null;
    this.removePhotoFlag = true;
  }

  private async uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'gymcontrol_upload');
    const res = await fetch('https://api.cloudinary.com/v1_1/dyvqspnz7/image/upload', {
      method: 'POST', body: formData,
    });
    if (!res.ok) throw new Error('Error al subir la imagen');
    const data = await res.json();
    return data.secure_url as string;
  }

  // ── Asistencias ──

  loadAsistencias(): void {
    const a = this.alumno();
    if (!a) return;
    this.loadingAsistencias.set(true);
    const filters: { alumno_id: number; fecha_desde?: string; fecha_hasta?: string } = { alumno_id: a.id };
    if (this.filterFechaDesde) filters.fecha_desde = this.filterFechaDesde;
    if (this.filterFechaHasta) filters.fecha_hasta = this.filterFechaHasta;
    this.api.getAsistencias(filters).subscribe({
      next: (data) => {
        this.asistencias.set(data);
        this.loadingAsistencias.set(false);
      },
      error: () => this.loadingAsistencias.set(false),
    });
  }

  filteredAsistencias = computed(() => {
    let list = this.asistencias();
    if (this.filterTipo() === 'asistencia') list = list.filter(x => x.asistio);
    if (this.filterTipo() === 'falta') list = list.filter(x => !x.asistio);
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

  fechaHoraCompleta(fecha: string): string {
    const d = new Date(fecha);
    const f = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });
    const h = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    return `${f}, ${h}`;
  }

  registradoPorStr(asis: Asistencia): string {
    return asis.maestro?.nombre ?? (asis.registrado_por ? `ID #${asis.registrado_por}` : '—');
  }

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

  applyAsisFilters(): void {
    this.asisPage.set(1);
    this.loadAsistencias();
  }

  clearAsisFilters(): void {
    this.filterFechaDesde = '';
    this.filterFechaHasta = '';
    this.filterTipo.set('todas');
    this.applyAsisFilters();
  }

  goToAsisPage(p: number): void {
    if (p >= 1 && p <= this.asisTotalPages()) this.asisPage.set(p);
  }

  onTabChange(value: unknown): void {
    const tab = String(value ?? 'info');
    this.activeTab.set(tab);
    if (tab === 'asistencias') this.loadAsistencias();
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const icons: Record<string, string> = { success: 'checkmark-circle', danger: 'close-circle' };
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'top',
      icon: icons[color],
      cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
