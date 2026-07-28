import { Component, inject, Input, signal, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton,
  IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonToggle,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, syncOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Inscripcion } from '../../Models/inscripciones';
import { Alumno } from '../../Models/alumnos';

@Component({
  selector: 'app-inscripcion-form-modal',
  imports: [
    FormsModule, DatePipe, DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton,
    IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonToggle,
  ],
  templateUrl: './inscripcion-form-modal.html',
  styleUrl: './inscripcion-form-modal.css',
})
export class InscripcionFormModal implements OnInit {
  @Input() inscripcion?: Inscripcion;

  private api = inject(ApiService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  alumnos = signal<Alumno[]>([]);
  searchText = '';
  filteredAlumnos = signal<Alumno[]>([]);
  selectedAlumno: Alumno | null = null;
  showDropdown = signal(false);

  monto: number | null = null;
  porcentaje_beca = 0;
  anio = new Date().getFullYear();
  fecha_pago = new Date().toISOString().split('T')[0];
  fecha_inicio = '';
  fecha_fin = '';
  pagado = true;
  notas = '';

  errors: Record<string, string> = {};
  saving = signal(false);

  constructor() {
    addIcons({ closeOutline, saveOutline, syncOutline, checkmarkCircleOutline, alertCircleOutline });
  }

  get isEdit(): boolean {
    return !!this.inscripcion;
  }

  get monto_final(): number {
    return (this.monto ?? 0) * (1 - this.porcentaje_beca / 100);
  }

  ngOnInit(): void {
    this.api.getAlumnos().subscribe({
      next: (data) => {
        this.alumnos.set(data);
        if (this.isEdit && this.inscripcion) {
          const a = data.find(x => x.id === this.inscripcion!.alumno_id);
          if (a) {
            this.selectedAlumno = a;
            this.searchText = `${a.nombrecompleto} ${a.apellido_paterno}`;
          }
        }
        this.filteredAlumnos.set(data);
        if (this.isEdit && this.inscripcion) {
          this.populateForm();
        }
      },
      error: () => this.showToast('Error al cargar alumnos', 'danger'),
    });
  }

  private populateForm(): void {
    const i = this.inscripcion!;
    this.monto = i.monto;
    this.porcentaje_beca = i.porcentaje_beca;
    this.anio = i.anio;
    this.fecha_pago = i.fecha_pago;
    this.fecha_inicio = i.fecha_inicio;
    this.fecha_fin = i.fecha_fin;
    this.pagado = i.pagado;
    this.notas = i.notas ?? '';
    this.cdr.detectChanges();
  }

  filterAlumnos(): void {
    const q = this.searchText.toLowerCase().trim();
    if (!q) {
      this.filteredAlumnos.set(this.alumnos());
    } else {
      this.filteredAlumnos.set(
        this.alumnos().filter(a =>
          `${a.nombrecompleto} ${a.apellido_paterno}`.toLowerCase().includes(q)
        )
      );
    }
    this.showDropdown.set(true);
  }

  onSearchBlur(): void {
    setTimeout(() => this.showDropdown.set(false), 150);
  }

  selectAlumno(alumno: Alumno): void {
    this.selectedAlumno = alumno;
    this.searchText = `${alumno.nombrecompleto} ${alumno.apellido_paterno}`;
    this.showDropdown.set(false);
    this.errors['alumno_id'] = '';
  }

  validate(): boolean {
    this.errors = {};
    if (!this.selectedAlumno) this.errors['alumno_id'] = 'Seleccione un alumno';
    if (this.monto === null || this.monto < 0) this.errors['monto'] = 'Ingrese un monto válido';
    if (this.porcentaje_beca < 0 || this.porcentaje_beca > 100) this.errors['porcentaje_beca'] = 'La beca debe estar entre 0 y 100';
    if (!this.anio || this.anio < 2000 || this.anio > 2100) this.errors['anio'] = 'Ingrese un año válido';
    if (!this.fecha_inicio) this.errors['fecha_inicio'] = 'Seleccione fecha de inicio';
    if (!this.fecha_fin) this.errors['fecha_fin'] = 'Seleccione fecha de fin';
    if (!this.fecha_pago) this.errors['fecha_pago'] = 'Seleccione fecha de pago';
    if (this.fecha_inicio && this.fecha_fin && this.fecha_fin <= this.fecha_inicio) {
      this.errors['fecha_fin'] = 'La fecha de fin debe ser posterior a la de inicio';
    }
    return Object.keys(this.errors).length === 0;
  }

  async save(): Promise<void> {
    if (!this.validate()) return;
    this.saving.set(true);

    const base = {
      monto: this.monto!,
      porcentaje_beca: this.porcentaje_beca,
      anio: this.anio,
      fecha_pago: this.fecha_pago,
      fecha_inicio: this.fecha_inicio,
      fecha_fin: this.fecha_fin,
      pagado: this.pagado,
      notas: this.notas || null,
    };

    const request = this.isEdit
      ? this.api.updateInscripcion(this.inscripcion!.id, base)
      : this.api.createInscripcion({ ...base, alumno_id: this.selectedAlumno!.id });

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalCtrl.dismiss(null, 'saved');
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.detail || 'Error al guardar';
        this.showToast(msg, 'danger');
      },
    });
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message, duration: 2500, position: 'bottom', color,
      icon: color === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline',
    });
    await toast.present();
  }
}
