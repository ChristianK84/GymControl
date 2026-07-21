import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { timeout, throwError } from 'rxjs';
import {
  IonIcon, IonButton, IonInput, IonSkeletonText, IonBadge,
  IonSelect, IonSelectOption, IonSpinner,
  ToastController, ModalController, AlertController,
} from '@ionic/angular/standalone';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
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
  imports: [FormsModule, IonIcon, IonButton, IonInput, IonSkeletonText, IonBadge, IonSelect, IonSelectOption, IonSpinner],
  templateUrl: './asistencias.html',
  styleUrl: './asistencias.css',
})
export class Asistencias implements OnInit, OnDestroy {
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

  private readonly user = this.session.getUser();
  readonly isMaestro = this.user?.role_id === 2;
  readonly maestroVinculado = this.isMaestro ? this.session.getMaestroId() : null;

  scanning = signal(false);

  constructor() {
    addIcons({
      addOutline, searchOutline, closeCircleOutline,
      chevronBackOutline, chevronForwardOutline,
      warningOutline, qrCodeOutline, checkmarkCircleOutline,
      alertCircleOutline, cameraOutline, stopOutline,
    });
  }

  ngOnInit(): void {
    if (this.isMaestro && !this.maestroVinculado) {
      this.asistencias.set([]);
      this.loading.set(false);
      return;
    }
    this.loadAsistencias();
    if (this.maestroVinculado) {
      this.maestroFilter.set(this.maestroVinculado);
    }
    if (!this.isMaestro) {
      this.api.getMaestros().subscribe({
        next: (data) => this.maestros.set(data),
      });
    }
  }

  private loadAsistencias(): void {
    this.loading.set(true);
    const filters: Record<string, string | number> = {};
    if (this.filterFechaDesde) filters['fecha_desde'] = this.filterFechaDesde;
    if (this.filterFechaHasta) filters['fecha_hasta'] = this.filterFechaHasta;
    if (this.maestroVinculado) filters['maestro_id'] = this.maestroVinculado;

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

    if (this.maestroVinculado) {
      this.startScan(this.maestroVinculado);
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

  private async startScan(maestroId: number): Promise<void> {
    this.scanning.set(true);
    try {
      await BarcodeScanner.requestPermissions();
    } catch {}
    await BarcodeScanner.stopScan().catch(() => {});

    try {
      const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      if (available) {
        const { barcodes } = await BarcodeScanner.scan();
        if (barcodes && barcodes.length > 0) {
          this.handleScan(barcodes[0].displayValue, maestroId);
          return;
        }
        this.scanning.set(false);
        this.showScanResult('No se detectó ningún código QR.', false);
        return;
      }
    } catch (e) {
      console.warn('Google Barcode Scanner no disponible:', e);
    }

    BarcodeScanner.addListener('barcodesScanned', async (event) => {
      await BarcodeScanner.stopScan().catch(() => {});
      BarcodeScanner.removeAllListeners().catch(() => {});
      this.handleScan(event.barcodes[0].displayValue, maestroId);
    });

    try {
      await BarcodeScanner.startScan();
    } catch {
      BarcodeScanner.removeAllListeners().catch(() => {});
      this.scanning.set(false);
      this.showScanResult('No se pudo acceder al escáner.', false);
    }
  }

  ngOnDestroy(): void {
    BarcodeScanner.removeAllListeners();
  }

  private async handleScan(decodedText: string, maestroId: number): Promise<void> {
    const alumnoId = parseInt(decodedText, 10);
    if (isNaN(alumnoId)) {
      this.scanning.set(false);
      this.showScanResult('Código QR no válido.', false);
      return;
    }

    this.api.scanAsistencia({ alumno_id: alumnoId, maestro_id: maestroId }).pipe(
      timeout({ first: 45000, with: () => throwError(() => new Error('timeout')) }),
    ).subscribe({
      next: (result) => {
        this.scanning.set(false);
        if (result.motivo === 'fuera_de_plan') {
          this.loadAsistencias();
          this.showScanResult(result.mensaje, true);
        } else if (result.permitido) {
          this.loadAsistencias();
          this.showScanResult(result.mensaje, true);
        } else {
          this.showScanResult(result.mensaje, false);
        }
      },
      error: (err) => {
        this.scanning.set(false);
        this.showScanResult(
          err.error?.detail ?? 'Error al procesar el escaneo.', false,
        );
      },
    });
  }

  stopQrScanner(): void {
    BarcodeScanner.stopScan().catch(() => {});
    this.scanning.set(false);
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
        const maestroId = (data as import('../../Models/alumnos').Alumno).maestro_id;

        const editModal = await this.modalCtrl.create({
          component: AsistenciaEditModal,
          componentProps: {
            selectedAlumno: data,
            maestros: this.maestros(),
            defaultMaestroId: maestroId,
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
    if (this.isMaestro) return this.user?.full_name ?? `ID #${id}`;
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
