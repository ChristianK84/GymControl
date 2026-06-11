import { Component, inject, Input, signal, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton,
  IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonToggle, IonAvatar,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, syncOutline, checkmarkCircleOutline, alertCircleOutline, informationCircleOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Membresia, TipoMembresia } from '../../Models/membresias';
import { Alumno } from '../../Models/alumnos';

@Component({
  selector: 'app-membresia-form-modal',
  imports: [
    FormsModule, DatePipe, DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton,
    IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonToggle, IonAvatar,
  ],
  templateUrl: './membresia-form-modal.html',
  styleUrl: './membresia-form-modal.css',
})
export class MembresiaFormModal implements OnInit {
  @Input() membresia?: Membresia;

  private api = inject(ApiService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  alumnos = signal<Alumno[]>([]);
  tipos = signal<TipoMembresia[]>([]);

  alumno_id: number | null = null;
  tipo_membresia_id: number | null = null;
  costo_real: number | null = null;
  porcentaje_beca = 0;
  fecha_inicio = '';
  fecha_vencimiento = '';
  estado_id: number | null = null;
  pagado = true;
  notas = '';

  errors: Record<string, string> = {};
  saving = signal(false);

  constructor() {
    addIcons({ closeOutline, saveOutline, syncOutline, checkmarkCircleOutline, alertCircleOutline, informationCircleOutline });
  }

  get isEdit(): boolean {
    return !!this.membresia;
  }

  private tryInitForm(): void {
    if (!this.membresia) return;
    if (!this.alumnos().length || !this.tipos().length) return;
    this.alumno_id = this.membresia.alumno_id;
    this.tipo_membresia_id = this.membresia.tipo_membresia_id;
    this.costo_real = this.membresia.costo_real;
    this.porcentaje_beca = this.membresia.porcentaje_beca;
    this.fecha_inicio = this.membresia.fecha_inicio;
    this.fecha_vencimiento = this.membresia.fecha_vencimiento;
    this.estado_id = this.membresia.estado_id;
    this.pagado = this.membresia.pagado;
    this.notas = this.membresia.notas ?? '';
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.api.getAlumnos().subscribe({
      next: (data) => { this.alumnos.set(data); this.tryInitForm(); },
    });
    this.api.getTiposMembresia().subscribe({
      next: (data) => { this.tipos.set(data); this.tryInitForm(); },
    });
    this.cdr.detectChanges();
  }

  onTipoChange(): void {
    if (this.tipo_membresia_id && !this.isEdit) {
      const tipo = this.tipos().find((t) => t.id === this.tipo_membresia_id);
      if (tipo) {
        this.costo_real = tipo.costo_base;
        if (tipo.duracion_dias && this.fecha_inicio) {
          const inicio = new Date(this.fecha_inicio);
          inicio.setDate(inicio.getDate() + tipo.duracion_dias);
          this.fecha_vencimiento = inicio.toISOString().split('T')[0];
        }
      }
    }
  }

  onFechaInicioChange(): void {
    if (this.tipo_membresia_id && this.fecha_inicio && !this.isEdit) {
      const tipo = this.tipos().find((t) => t.id === this.tipo_membresia_id);
      if (tipo) {
        const inicio = new Date(this.fecha_inicio);
        inicio.setDate(inicio.getDate() + tipo.duracion_dias);
        this.fecha_vencimiento = inicio.toISOString().split('T')[0];
      }
    }
  }

  validate(): boolean {
    this.errors = {};
    if (!this.alumno_id) this.errors['alumno_id'] = 'Seleccione un alumno';
    if (!this.tipo_membresia_id) this.errors['tipo_membresia_id'] = 'Seleccione un tipo de membresía';
    if (this.costo_real === null || this.costo_real < 0) this.errors['costo_real'] = 'Ingrese un costo válido';
    if (this.porcentaje_beca < 0 || this.porcentaje_beca > 100) this.errors['porcentaje_beca'] = 'La beca debe estar entre 0 y 100';
    if (!this.fecha_inicio) this.errors['fecha_inicio'] = 'Seleccione fecha de inicio';
    if (!this.fecha_vencimiento) this.errors['fecha_vencimiento'] = 'Seleccione fecha de vencimiento';
    return Object.keys(this.errors).length === 0;
  }

  async save(): Promise<void> {
    if (!this.validate()) return;

    this.saving.set(true);
    const body = {
      alumno_id: this.alumno_id!,
      tipo_membresia_id: this.tipo_membresia_id!,
      costo_real: this.costo_real!,
      porcentaje_beca: this.porcentaje_beca,
      fecha_inicio: this.fecha_inicio,
      fecha_vencimiento: this.fecha_vencimiento,
      ...(this.isEdit && this.estado_id !== null ? { estado_id: this.estado_id } : {}),
      pagado: this.pagado,
      notas: this.notas || null,
    };

    const request = this.isEdit
      ? this.api.updateMembresia(this.membresia!.id, body)
      : this.api.createMembresia(body);

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

  getAlumnoLabel(alumno: Alumno): string {
    return `${alumno.nombrecompleto} ${alumno.apellido_paterno}`;
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
      icon: color === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline',
    });
    await toast.present();
  }
}
