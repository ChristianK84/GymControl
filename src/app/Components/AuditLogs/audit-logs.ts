import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonIcon, IonSelect, IonSelectOption, IonSkeletonText, IonBadge, IonInput,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline,
  checkmarkCircleOutline, alertCircleOutline,
} from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { AuditLogEntry } from '../../Models/audit-logs';

@Component({
  selector: 'app-audit-logs',
  imports: [
    FormsModule,
    IonButton, IonIcon, IonSelect, IonSelectOption, IonSkeletonText, IonBadge, IonInput,
  ],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css',
})
export class AuditLogs implements OnInit {
  private api = inject(ApiService);
  private toastCtrl = inject(ToastController);

  allLogs = signal<AuditLogEntry[]>([]);
  loading = signal(true);
  page = signal(1);
  readonly pageSize = 7;

  searchTerm = signal('');
  filterAction = signal<string | null>(null);
  filterEntity = signal<string | null>(null);

  readonly actionOptions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'SCAN', 'SEND_EMAIL'];
  readonly entityOptions = ['auth', 'alumno', 'maestro', 'usuario', 'membresia', 'asistencia', 'tipo_membresia'];

  constructor() {
    addIcons({ searchOutline, closeCircleOutline, chevronBackOutline, chevronForwardOutline, checkmarkCircleOutline, alertCircleOutline });
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.page.set(1);
    const params: Record<string, string> = {};
    if (this.filterAction()) params['action'] = this.filterAction()!;
    if (this.filterEntity()) params['entity'] = this.filterEntity()!;
    this.api.getAuditLogs(params).subscribe({
      next: (data) => {
        this.allLogs.set(data);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.showToast('Error al cargar la bitácora', 'danger'); },
    });
  }

  onFilterChange(): void {
    this.loadLogs();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterAction.set(null);
    this.filterEntity.set(null);
    this.loadLogs();
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.allLogs();
    return this.allLogs().filter(
      (l) =>
        (l.user_nombre?.toLowerCase() ?? '').includes(term) ||
        l.descripcion.toLowerCase().includes(term) ||
        l.action.toLowerCase().includes(term) ||
        l.entity.toLowerCase().includes(term),
    );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  pagedLogs = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  fechaCorta(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  horaCorta(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'bottom',
      icon: color === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline',
    });
    await toast.present();
  }
}
