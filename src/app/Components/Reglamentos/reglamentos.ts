import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  IonButton, IonIcon, IonBadge, IonSkeletonText, IonInput,
  ModalController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, searchOutline, closeCircleOutline, fileTrayOutline,
  checkmarkDoneOutline, eyeOutline, trashOutline, linkOutline,
  chevronBackOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { Reglamento } from '../../Models/reglamentos';
import { UploadReglamentoModal } from './upload-reglamento-modal';
import { EditReglamentoModal } from './edit-reglamento-modal';
import { GenerarLinksModal } from './generar-links-modal';

@Component({
  selector: 'app-reglamentos',
  imports: [
    FormsModule, DatePipe,
    IonButton, IonIcon, IonBadge, IonSkeletonText, IonInput,
  ],
  templateUrl: './reglamentos.html',
  styleUrl: './reglamentos.css',
})
export class Reglamentos implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  reglamentos = signal<Reglamento[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  page = signal(1);
  readonly pageSize = 8;

  constructor() {
    addIcons({ addOutline, searchOutline, closeCircleOutline, fileTrayOutline, checkmarkDoneOutline, eyeOutline, trashOutline, linkOutline, chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit(): void {
    this.loadReglamentos();
  }

  loadReglamentos(): void {
    this.loading.set(true);
    this.api.getReglamentos().subscribe({
      next: (data) => {
        this.reglamentos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Error al cargar documentos', 'danger');
      },
    });
  }

  filteredReglamentos = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.reglamentos();
    return this.reglamentos().filter(
      (r) =>
        r.titulo.toLowerCase().includes(term) ||
        r.version.toLowerCase().includes(term),
    );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredReglamentos().length / this.pageSize)));

  pagedReglamentos = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredReglamentos().slice(start, start + this.pageSize);
  });

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  async openUploadModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: UploadReglamentoModal,
    });
    modal.onDidDismiss().then(({ data, role }) => {
      if (role === 'saved') {
        this.loadReglamentos();
        this.showToast('Documento subido exitosamente', 'success');
      }
    });
    await modal.present();
  }

  async deleteReglamento(reg: Reglamento): Promise<void> {
    this.api.deleteReglamento(reg.id).subscribe({
      next: () => {
        this.loadReglamentos();
        this.showToast('Documento eliminado', 'success');
      },
      error: () => this.showToast('Error al eliminar documento', 'danger'),
    });
  }

  verFirmas(): void {
    this.router.navigate(['/dashboard/reglamentos/firmas']);
  }

  async verPdf(reg: Reglamento): Promise<void> {
    window.open(reg.url_pdf_cloudinary, '_blank');
  }

  async editarReglamento(reg: Reglamento): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: EditReglamentoModal,
      componentProps: { reglamento: reg },
    });
    modal.onDidDismiss().then(({ data, role }) => {
      if (role === 'saved') {
        this.loadReglamentos();
        this.showToast('Documento actualizado', 'success');
      }
    });
    await modal.present();
  }

  async generarLinks(reg: Reglamento): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: GenerarLinksModal,
      componentProps: { reglamentoId: reg.id },
    });
    modal.onDidDismiss().then(({ role }) => {
      if (role === 'saved') {
        this.showToast('Links generados y enviados exitosamente', 'success');
      }
    });
    await modal.present();
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message, duration: 3000, color, position: 'top',
    });
    await toast.present();
  }
}
