import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonIcon, IonButton, IonInput, IonSkeletonText, IonBadge,
  IonSelect, IonSelectOption,
  ToastController, ModalController, AlertController,
} from '@ionic/angular/standalone';
import { Html5Qrcode } from 'html5-qrcode';
import { ApiService } from '../../Services/api-service';
import { SessionService } from '../../Services/session.service';
import { Asistencia } from '../../Models/asistencias';
import { Maestro } from '../../Models/maestros';
import { addIcons } from 'ionicons';
import {
  addOutline, searchOutline, closeCircleOutline,
  chevronBackOutline, chevronForwardOutline,
  warningOutline, qrCodeOutline, checkmarkCircleOutline,
  alertCircleOutline, cameraOutline, stopOutline,
} from 'ionicons/icons';
import { AsistenciaEditModal } from './asistencia-edit-modal';
import { AsistenciaRegisterModal } from './asistencia-register-modal';

@Component({
  selector: 'app-asistencias',
  imports: [FormsModule, IonIcon, IonButton, IonInput, IonSkeletonText, IonBadge, IonSelect, IonSelectOption],
  templateUrl: './asistencias.html',
  styleUrl: './asistencias.css',
})
export class Asistencias implements OnInit {
  private api = inject(ApiService);
  private session = inject(SessionService);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

  asistencias = signal<Asistencia[]>([]);
  maestros = signal<Maestro[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  maestroFilter = signal<number | null>(null);
  tipoFilter = signal<'todas' | 'asistio' | 'falta'>('todas');
  filterFechaDesde = '';
  filterFechaHasta = '';
  page = signal(1);
  readonly pageSize = 8;

  scanning = signal(false);
  private scanner: Html5Qrcode | null = null;

  constructor() {
    addIcons({
      addOutline, searchOutline, closeCircleOutline,
      chevronBackOutline, chevronForwardOutline,
      warningOutline, qrCodeOutline, checkmarkCircleOutline,
      alertCircleOutline, cameraOutline, stopOutline,
    });
  }

  ngOnInit(): void {
    this.loadAsistencias();
    this.api.getMaestros().subscribe({
      next: (data) => this.maestros.set(data),
    });
  }

  private loadAsistencias(): void {
    this.loading.set(true);
    const filters: Record<string, string | number> = {};
    if (this.filterFechaDesde) filters['fecha_desde'] = this.filterFechaDesde;
    if (this.filterFechaHasta) filters['fecha_hasta'] = this.filterFechaHasta;

    this.api.getAsistencias(filters as any).subscribe({
      next: (data) => {
        this.asistencias.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  async openQrScanner(): Promise<void> {
    const user = this.session.getUser();
    if (!user) {
      this.showScanResult('Sesión expirada. Inicia sesión nuevamente.', false);
      return;
    }

    const maestroVinculado = this.maestros().find(m => m.user_id === user.user_id);
    if (maestroVinculado) {
      this.startScan(maestroVinculado.id);
      return;
    }

    const isAdmin = user.role_id === 1;
    const maestros = this.maestros();

    if (isAdmin && maestros.length > 0) {
      const inputs = maestros.map(m => ({
        name: 'maestro',
        type: 'radio' as const,
        label: `${m.nombre} ${m.apellido_paterno}`,
        value: m.id,
      }));

      const alert = await this.alertCtrl.create({
        header: 'Seleccionar maestro',
        message: 'Como administrador, elige con qué perfil registrar la asistencia.',
        inputs,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Seleccionar',
            handler: (selectedId: number) => {
              if (selectedId) this.startScan(Number(selectedId));
            },
          },
        ],
      });
      await alert.present();
      return;
    }

    this.showScanResult('No tienes un perfil de maestro vinculado. Contacta al administrador.', false);
  }

  private startScan(maestroId: number): void {
    this.scanning.set(true);

    this.scanner = new Html5Qrcode('qr-reader');
    this.scanner.start(
      { facingMode: { ideal: 'environment' } },
      { fps: 5, qrbox: { width: 250, height: 250 } },
      (decodedText: string) => this.handleScan(decodedText, maestroId),
      () => {},
    ).catch(() => {
      this.scanning.set(false);
      this.showScanResult('No se pudo acceder a la cámara. Verifica los permisos.', false);
    });
  }

  private async handleScan(decodedText: string, maestroId: number): Promise<void> {
    const alumnoId = parseInt(decodedText, 10);
    if (isNaN(alumnoId)) {
      this.stopScanner();
      this.showScanResult('Código QR no válido.', false);
      return;
    }

    this.api.scanAsistencia({ alumno_id: alumnoId, maestro_id: maestroId }).subscribe({
      next: (result) => {
        this.stopScanner();
        if (result.motivo === 'fuera_de_plan') {
          this.showExtraDayConfirm(result.mensaje, result.costo_extra!, alumnoId, maestroId);
        } else if (result.permitido) {
          this.loadAsistencias();
          this.showScanResult(result.mensaje, true);
        } else {
          this.showScanResult(result.mensaje, false);
        }
      },
      error: () => {
        this.stopScanner();
        this.showScanResult('Error al procesar el escaneo.', false);
      },
    });
  }

  private async showExtraDayConfirm(mensaje: string, costoExtra: number, alumnoId: number, maestroId: number): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Día fuera de plan',
      message: mensaje,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: `Cobrar $${costoExtra.toFixed(2)}`,
          handler: () => {
            const body = {
              alumno_id: alumnoId,
              maestro_id: maestroId,
              fecha: new Date().toISOString(),
              asistio: true,
              es_dia_extra: true,
              costo_extra: costoExtra,
            };
            this.api.createAsistencia(body).subscribe({
              next: () => {
                this.loadAsistencias();
                this.showScanResult('Asistencia registrada con costo extra.', true);
              },
              error: () => this.showScanResult('Error al registrar asistencia.', false),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  private stopScanner(): void {
    if (this.scanner) {
      this.scanner.stop().then(() => {
        this.scanner = null;
        this.scanning.set(false);
      }).catch(() => {
        this.scanner = null;
        this.scanning.set(false);
      });
    } else {
      this.scanning.set(false);
    }
  }

  stopQrScanner(): void {
    this.stopScanner();
    this.showScanResult('Escáner detenido.', false);
  }

  private async showScanResult(message: string, success: boolean): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      position: 'top',
      color: success ? 'success' : 'danger',
      icon: success ? 'checkmark-circle' : 'close-circle',
      cssClass: 'custom-toast',
    });
    await toast.present();
  }

  async openRegisterModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AsistenciaRegisterModal,
    });
    modal.onDidDismiss().then(async ({ data, role }) => {
      if (role === 'selected' && data) {
        const user = this.session.getUser();
        const maestroVinculado = this.maestros().find(m => m.user_id === user?.user_id);

        const editModal = await this.modalCtrl.create({
          component: AsistenciaEditModal,
          componentProps: {
            selectedAlumno: data,
            maestros: this.maestros(),
            defaultMaestroId: maestroVinculado?.id,
          },
        });
        editModal.onDidDismiss().then(({ role: editRole }) => {
          if (editRole === 'saved') {
            this.loadAsistencias();
            this.showScanResult('Asistencia registrada', true);
          }
        });
        await editModal.present();
      }
    });
    await modal.present();
  }

  maestroNombre(id: number): string {
    const m = this.maestros().find(x => x.id === id);
    return m ? `${m.nombre} ${m.apellido_paterno.charAt(0)}.` : `ID #${id}`;
  }

  fechaHora(fecha: string): { fecha: string; hora: string } {
    const d = new Date(fecha);
    return {
      fecha: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  iniciales(nombre: string): string {
    return nombre.trim().split(' ').map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  filtered = computed(() => {
    let list = this.asistencias();
    const term = this.searchTerm().toLowerCase().trim();
    const maestroId = this.maestroFilter();
    const tipo = this.tipoFilter();

    if (term) {
      list = list.filter(a =>
        a.alumno?.nombrecompleto?.toLowerCase().includes(term) ||
        a.alumno?.apellido_paterno?.toLowerCase().includes(term) ||
        (a.notas ?? '').toLowerCase().includes(term),
      );
    }
    if (maestroId !== null) {
      list = list.filter(a => a.maestro_id === maestroId);
    }
    if (tipo === 'asistio') list = list.filter(a => a.asistio);
    if (tipo === 'falta') list = list.filter(a => !a.asistio);

    return list;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  onMaestroChange(value: number | null): void {
    this.maestroFilter.set(value);
    this.page.set(1);
  }

  onTipoChange(value: 'todas' | 'asistio' | 'falta'): void {
    this.tipoFilter.set(value);
    this.page.set(1);
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadAsistencias();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.maestroFilter.set(null);
    this.tipoFilter.set('todas');
    this.filterFechaDesde = '';
    this.filterFechaHasta = '';
    this.page.set(1);
    this.loadAsistencias();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  async openEditModal(asis: Asistencia): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AsistenciaEditModal,
      componentProps: { asistencia: asis, maestros: this.maestros() },
    });
    modal.onDidDismiss().then(({ data, role }) => {
      if (role === 'saved') {
        this.loadAsistencias();
        this.showScanResult('Asistencia actualizada', true);
      }
    });
    await modal.present();
  }
}
