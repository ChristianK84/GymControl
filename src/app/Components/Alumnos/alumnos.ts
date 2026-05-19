import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon, AlertController, ToastController } from '@ionic/angular/standalone';
import { ApiService } from '../../Services/api-service';
import { Alumno } from '../../Models/alumnos';
import { Maestro } from '../../Models/maestros';
import { addIcons } from 'ionicons';
import {
  addOutline, searchOutline, optionsOutline, chevronBackOutline,
  chevronForwardOutline, ellipsisVerticalOutline, peopleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-alumnos',
  imports: [FormsModule, IonIcon],
  templateUrl: './alumnos.html',
  styleUrl: './alumnos.css',
})
export class Alumnos implements OnInit {
  private api = inject(ApiService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  allAlumnos: Alumno[] = [];
  maestros: Maestro[] = [];

  searchTerm = signal('');
  grupoFilter = signal('');
  membresiaFilter = signal('');
  page = signal(1);
  readonly pageSize = 8;

  constructor() {
    addIcons({
      addOutline, searchOutline, optionsOutline, chevronBackOutline,
      chevronForwardOutline, ellipsisVerticalOutline, peopleOutline,
    });
  }

  ngOnInit(): void {
    this.api.getAlumnos(false).subscribe({
      next: (data) => (this.allAlumnos = data),
    });
    this.api.getMaestros(false).subscribe({
      next: (data) => (this.maestros = data),
    });
  }

  maestroNombre(maestroId: number): string {
    const m = this.maestros.find((x) => x.id === maestroId);
    return m ? `${m.nombre} ${m.apellido_paterno.charAt(0)}.` : `ID #${maestroId}`;
  }

  edad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    return edad;
  }

  iniciales(nombre: string): string {
    const partes = nombre.trim().split(' ');
    const iniciales = partes.map((p) => p.charAt(0).toUpperCase());
    return iniciales.slice(0, 2).join('');
  }

  grupoColor(rama: string): string {
    switch (rama.toLowerCase()) {
      case 'infantil':
        return '#707171';
      case 'juvenil':
        return '#e30613';
      case 'adulto':
        return '#2a1714';
      default:
        return '#936e69';
    }
  }

  filtered = computed(() => {
    let list = this.allAlumnos;
    const s = this.searchTerm().toLowerCase();
    if (s) {
      list = list.filter(
        (a) =>
          a.nombrecompleto.toLowerCase().includes(s) ||
          a.apellido_paterno.toLowerCase().includes(s) ||
          (a.apellido_materno ?? '').toLowerCase().includes(s),
      );
    }
    if (this.grupoFilter()) {
      list = list.filter(
        (a) => a.rama.toLowerCase() === this.grupoFilter().toLowerCase(),
      );
    }
    return list;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  pagedAlumnos = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  onFilterChange(): void {
    this.page.set(1);
  }

  goToPage(p: number): void {
    this.page.set(p);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.grupoFilter.set('');
    this.membresiaFilter.set('');
    this.onFilterChange();
  }

  async deleteAlumno(alumno: Alumno): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Alumno',
      message: `¿Estás seguro de eliminar a ${alumno.nombrecompleto}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.api.deleteAlumno(alumno.id).subscribe({
              next: () => {
                this.allAlumnos = this.allAlumnos.filter((a) => a.id !== alumno.id);
                this.showToast('Alumno eliminado');
              },
              error: () => this.showToast('Error al eliminar', 'danger'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
