import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonInput, IonSearchbar,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, searchOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Alumno } from '../../Models/alumnos';

@Component({
  selector: 'app-asistencia-register-modal',
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonIcon, IonInput,
  ],
  templateUrl: './asistencia-register-modal.html',
  styleUrl: './asistencia-register-modal.css',
})
export class AsistenciaRegisterModal implements OnInit {
  private api = inject(ApiService);
  private modalCtrl = inject(ModalController);

  alumnos = signal<Alumno[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  constructor() {
    addIcons({ closeOutline, searchOutline });
  }

  ngOnInit(): void {
    this.api.getAlumnos().subscribe({
      next: (data) => {
        this.alumnos.set(data.filter(a => a.is_active));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return [];
    return this.alumnos().filter(
      a =>
        a.nombrecompleto.toLowerCase().includes(term) ||
        a.apellido_paterno.toLowerCase().includes(term) ||
        (a.apellido_materno ?? '').toLowerCase().includes(term),
    );
  });

  select(alumno: Alumno): void {
    this.modalCtrl.dismiss(alumno, 'selected');
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
