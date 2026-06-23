import { Component, inject, Input, signal, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton,
  IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonToggle, IonAvatar,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, syncOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { TipoMembresia } from '../../Models/membresias';

const DIAS_OPTIONS = [
  { label: 'Libre (todos los días)', value: 'libre' },
  { label: 'Lunes a Viernes', value: 'lunes-viernes' },
  { label: 'Lunes a Jueves', value: 'lunes-jueves' },
  { label: 'Sábado', value: 'sabado' },
  { label: 'Sábado y Domingo', value: 'sabado-domingo' },
  { label: 'Lunes, Miércoles y Viernes', value: 'lunes,miercoles,viernes' },
];

@Component({
  selector: 'app-tipo-membresia-form-modal',
  imports: [
    FormsModule, DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton,
    IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonToggle, IonAvatar,
  ],
  templateUrl: './tipo-membresia-form-modal.html',
  styleUrl: './tipo-membresia-form-modal.css',
})
export class TipoMembresiaFormModal implements OnInit {
  @Input() tipo?: TipoMembresia;

  private api = inject(ApiService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  nombre = '';
  descripcion = '';
  costo_base: number | null = null;
  duracion_dias: number | null = null;
  dias_incluidos = '';
  dias_por_semana: number | null = null;
  horas_por_clase: number | null = null;
  nivel_competitivo = false;
  color = '';
  permite_dias_extra = false;
  costo_dia_extra: number | null = null;
  bloquear_impago = false;
  is_active = true;

  errors: Record<string, string> = {};
  saving = signal(false);

  readonly diasOptions = DIAS_OPTIONS;

  constructor() {
    addIcons({ closeOutline, saveOutline, syncOutline, checkmarkCircleOutline, alertCircleOutline });
  }

  get isEdit(): boolean {
    return !!this.tipo;
  }

  ngOnInit(): void {
    if (this.tipo) {
      this.nombre = this.tipo.nombre;
      this.descripcion = this.tipo.descripcion ?? '';
      this.costo_base = this.tipo.costo_base;
      this.duracion_dias = this.tipo.duracion_dias;
      this.dias_incluidos = this.tipo.dias_incluidos;
      this.dias_por_semana = this.tipo.dias_por_semana;
      this.horas_por_clase = this.tipo.horas_por_clase;
      this.nivel_competitivo = this.tipo.nivel_competitivo;
      this.color = this.tipo.color ?? '';
      this.permite_dias_extra = this.tipo.permite_dias_extra;
      this.costo_dia_extra = this.tipo.costo_dia_extra;
      this.bloquear_impago = this.tipo.bloquear_impago;
      this.is_active = this.tipo.is_active;
      this.cdr.detectChanges();
    }
  }

  validate(): boolean {
    this.errors = {};
    if (!this.nombre.trim()) this.errors['nombre'] = 'El nombre es obligatorio';
    if (this.costo_base === null || this.costo_base < 0) this.errors['costo_base'] = 'Ingrese un costo válido';
    if (this.duracion_dias === null || this.duracion_dias < 1) this.errors['duracion_dias'] = 'Ingrese una duración válida';
    if (!this.dias_incluidos) this.errors['dias_incluidos'] = 'Seleccione los días incluidos';
    if (this.permite_dias_extra && (this.costo_dia_extra === null || this.costo_dia_extra < 0)) {
      this.errors['costo_dia_extra'] = 'Ingrese el costo por día extra';
    }
    if (this.color && !/^#[0-9a-fA-F]{6}$/.test(this.color)) {
      this.errors['color'] = 'Color debe ser un hex válido (ej: #3b82f6)';
    }
    return Object.keys(this.errors).length === 0;
  }

  async save(): Promise<void> {
    if (!this.validate()) return;
    this.saving.set(true);

    const body = {
      nombre: this.nombre.trim(),
      costo_base: this.costo_base!,
      duracion_dias: this.duracion_dias!,
      dias_incluidos: this.dias_incluidos,
      dias_por_semana: this.dias_por_semana,
      horas_por_clase: this.horas_por_clase,
      nivel_competitivo: this.nivel_competitivo,
      color: this.color || null,
      descripcion: this.descripcion || null,
      permite_dias_extra: this.permite_dias_extra,
      costo_dia_extra: this.costo_dia_extra,
      bloquear_impago: this.bloquear_impago,
    };

    const request = this.isEdit
      ? this.api.updateTipoMembresia(this.tipo!.id, { ...body, is_active: this.is_active })
      : this.api.createTipoMembresia(body);

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
      message,
      duration: 2500,
      position: 'bottom',
      color,
      icon: color === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline',
    });
    await toast.present();
  }
}
