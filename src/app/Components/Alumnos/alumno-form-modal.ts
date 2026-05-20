import { Component, inject, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFooter, ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Alumno } from '../../Models/alumnos';
import { Maestro } from '../../Models/maestros';

@Component({
  selector: 'app-alumno-form-modal',
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonIcon, IonFooter,
  ],
  templateUrl: './alumno-form-modal.html',
  styleUrl: './alumno-form-modal.css',
})
export class AlumnoFormModal implements OnInit {
  @Input() alumno?: Alumno;
  @Input() maestros: Maestro[] = [];

  private modalCtrl = inject(ModalController);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  get isEdit(): boolean {
    return !!this.alumno;
  }

  // Alumno fields
  nombrecompleto = '';
  apellidoPaterno = '';
  apellidoMaterno = '';
  rama = '';
  fechaNacimiento = '';
  maestroId: number | undefined = undefined;
  fechaInscripcion = '';

  // Tutor
  tutorNombre = '';
  tutorApellidoP = '';
  tutorApellidoM = '';
  tutorTelefono = '';
  tutorEmail = '';

  // Contacto emergencia
  contactoNombre = '';
  contactoApellidoP = '';
  contactoApellidoM = '';
  contactoTelefono = '';

  // Ficha médica
  tipoSangre = '';
  alergias = '';
  medicamentos = '';
  condicionesMedicas = '';
  nss = '';

  createdAt = '';
  errors: Record<string, string> = {};

  constructor() {
    addIcons({ closeOutline });
  }

  ngOnInit(): void {
    this.fechaInscripcion = new Date().toISOString().split('T')[0];

    if (this.alumno) {
      this.nombrecompleto = this.alumno.nombrecompleto;
      this.apellidoPaterno = this.alumno.apellido_paterno;
      this.apellidoMaterno = this.alumno.apellido_materno ?? '';
      this.rama = this.alumno.rama;
      this.fechaNacimiento = this.alumno.fecha_nacimiento;
      this.maestroId = this.alumno.maestro_id;
      this.fechaInscripcion = this.alumno.fecha_inscripcion;

      if (this.alumno.tutor) {
        this.tutorNombre = this.alumno.tutor.nombre;
        this.tutorApellidoP = this.alumno.tutor.apellido_paterno;
        this.tutorApellidoM = this.alumno.tutor.apellido_materno ?? '';
        this.tutorTelefono = this.alumno.tutor.telefono;
        this.tutorEmail = this.alumno.tutor.email;
      }
      if (this.alumno.contacto_emergencia) {
        this.contactoNombre = this.alumno.contacto_emergencia.nombre;
        this.contactoApellidoP = this.alumno.contacto_emergencia.apellido_paterno;
        this.contactoApellidoM = this.alumno.contacto_emergencia.apellido_materno ?? '';
        this.contactoTelefono = this.alumno.contacto_emergencia.telefono;
      }
      if (this.alumno.ficha_medica) {
        this.tipoSangre = this.alumno.ficha_medica.tipo_sangre ?? '';
        this.alergias = this.alumno.ficha_medica.alergias ?? '';
        this.medicamentos = this.alumno.ficha_medica.medicamentos ?? '';
        this.condicionesMedicas = this.alumno.ficha_medica.condiciones_medicas ?? '';
        this.nss = this.alumno.ficha_medica.nss ?? '';
      }
      this.createdAt = new DatePipe('es-MX').transform(
        this.alumno.created_at, "d 'de' MMMM 'del' yyyy",
      )!;
    }
    this.cdr.detectChanges();
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  private validate(): boolean {
    this.errors = {};
    if (!this.nombrecompleto.trim()) this.errors['nombrecompleto'] = 'Requerido';
    if (!this.apellidoPaterno.trim()) this.errors['apellidoPaterno'] = 'Requerido';
    if (!this.rama) this.errors['rama'] = 'Seleccione una rama';
    if (!this.fechaNacimiento) this.errors['fechaNacimiento'] = 'Requerida';
    if (this.maestroId == null) this.errors['maestroId'] = 'Seleccione un entrenador';
    if (!this.isEdit) {
      if (!this.tutorNombre.trim()) this.errors['tutorNombre'] = 'Requerido';
      if (!this.tutorApellidoP.trim()) this.errors['tutorApellidoP'] = 'Requerido';
      if (!this.tutorTelefono.trim()) this.errors['tutorTelefono'] = 'Requerido';
      if (!this.contactoNombre.trim()) this.errors['contactoNombre'] = 'Requerido';
      if (!this.contactoApellidoP.trim()) this.errors['contactoApellidoP'] = 'Requerido';
      if (!this.contactoTelefono.trim()) this.errors['contactoTelefono'] = 'Requerido';
    }
    return Object.keys(this.errors).length === 0;
  }

  save(): void {
    if (!this.validate()) return;

    if (this.isEdit) {
      this.api.updateAlumno(this.alumno!.id, {
        nombrecompleto: this.nombrecompleto || undefined,
        apellido_paterno: this.apellidoPaterno || undefined,
        apellido_materno: this.apellidoMaterno || null,
        rama: this.rama || undefined,
        fecha_nacimiento: this.fechaNacimiento || undefined,
        maestro_id: this.maestroId,
        fecha_inscripcion: this.fechaInscripcion || undefined,
        ...this.tutorChanged() && {
          tutor: {
            nombre: this.tutorNombre || undefined,
            apellido_paterno: this.tutorApellidoP || undefined,
            apellido_materno: this.tutorApellidoM || null,
            telefono: this.tutorTelefono || undefined,
            email: this.tutorEmail || undefined,
          },
        },
        ...this.contactoChanged() && {
          contacto_emergencia: {
            nombre: this.contactoNombre || undefined,
            apellido_paterno: this.contactoApellidoP || undefined,
            apellido_materno: this.contactoApellidoM || null,
            telefono: this.contactoTelefono || undefined,
          },
        },
        ...this.fichaChanged() && {
          ficha_medica: {
            tipo_sangre: this.tipoSangre || null,
            alergias: this.alergias || null,
            medicamentos: this.medicamentos || null,
            condiciones_medicas: this.condicionesMedicas || null,
            nss: this.nss || null,
          },
        },
      }).subscribe({
        next: (updated) => this.modalCtrl.dismiss(updated, 'saved'),
      });
    } else {
      this.api.createAlumno({
        nombrecompleto: this.nombrecompleto,
        apellido_paterno: this.apellidoPaterno,
        apellido_materno: this.apellidoMaterno || null,
        rama: this.rama,
        fecha_nacimiento: this.fechaNacimiento,
        maestro_id: this.maestroId!,
        fecha_inscripcion: this.fechaInscripcion,
        tutor: {
          nombre: this.tutorNombre,
          apellido_paterno: this.tutorApellidoP,
          apellido_materno: this.tutorApellidoM || null,
          telefono: this.tutorTelefono,
          email: this.tutorEmail,
        },
        contacto_emergencia: {
          nombre: this.contactoNombre,
          apellido_paterno: this.contactoApellidoP,
          apellido_materno: this.contactoApellidoM || null,
          telefono: this.contactoTelefono,
        },
        ficha_medica: {
          tipo_sangre: this.tipoSangre || null,
          alergias: this.alergias || null,
          medicamentos: this.medicamentos || null,
          condiciones_medicas: this.condicionesMedicas || null,
          nss: this.nss || null,
        },
      }).subscribe({
        next: (created) => this.modalCtrl.dismiss(created, 'saved'),
      });
    }
  }

  private tutorChanged(): boolean {
    return this.tutorNombre !== '' || this.tutorApellidoP !== '' || this.tutorTelefono !== '' || this.tutorEmail !== '';
  }

  private contactoChanged(): boolean {
    return this.contactoNombre !== '' || this.contactoApellidoP !== '' || this.contactoTelefono !== '';
  }

  private fichaChanged(): boolean {
    return this.tipoSangre !== '' || this.alergias !== '' || this.medicamentos !== '' || this.condicionesMedicas !== '' || this.nss !== '';
  }
}
