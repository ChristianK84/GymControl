import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, AlertController, ModalController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personAddOutline,
  searchOutline,
  filterOutline,
  closeCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  pencilOutline,
  trashOutline,
} from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { User } from '../../Models/users';
import { Rol } from '../../Models/catalogs';
import { UserFormModal } from './user-edit-modal';

@Component({
  selector: 'app-users',
  imports: [DatePipe, FormsModule, IonIcon],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private api = inject(ApiService);
  private alertCtrl = inject(AlertController);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  allUsers = signal<User[]>([]);
  roles = signal<Rol[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  roleFilter = signal<number | null | undefined>(undefined);
  page = signal(1);
  readonly pageSize = 6;

  roleName = computed(() => {
    const map = new Map<number, string>();
    for (const r of this.roles()) {
      map.set(r.id, r.nombre);
    }
    return map;
  });

  filtered = computed(() => {
    let result = this.allUsers();
    const term = this.searchTerm().toLowerCase().trim();

    if (term) {
      result = result.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(term) ||
          u.username.toLowerCase().includes(term),
      );
    }

    const role = this.roleFilter();
    if (role != null) {
      result = result.filter((u) => u.role_id === role);
    }

    return result;
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );

  pagedUsers = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  constructor() {
    addIcons({
      personAddOutline,
      searchOutline,
      filterOutline,
      closeCircleOutline,
      chevronBackOutline,
      chevronForwardOutline,
      pencilOutline,
      trashOutline,
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  private loadRoles(): void {
    this.api.getRoles().subscribe({
      next: (data) => {
        this.roles.set(data);
        this.tryFinishLoading();
      },
    });
  }

  private loadUsers(): void {
    this.api.getUsers(true).subscribe({
      next: (data) => {
        this.allUsers.set(data);
        this.tryFinishLoading();
      },
    });
  }

  private pending = 2;
  private tryFinishLoading(): void {
    this.pending--;
    if (this.pending <= 0) {
      this.loading.set(false);
    }
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    toast.present();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.roleFilter.set(undefined);
    this.page.set(1);
  }

  onFilterChange(): void {
    this.page.set(1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
    }
  }

  async addUser(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: UserFormModal,
      componentProps: { roles: this.roles() },
    });
    await modal.present();

    const { role } = await modal.onDidDismiss();
    if (role === 'saved') {
      this.loadUsers();
      this.showToast('Usuario creado con éxito', 'success');
    }
  }

  async editUser(user: User): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: UserFormModal,
      componentProps: {
        user,
        roles: this.roles(),
      },
    });
    await modal.present();

    const { role } = await modal.onDidDismiss();
    if (role === 'saved') {
      this.loadUsers();
      this.showToast('Usuario actualizado con éxito', 'success');
    }
  }

  async deleteUser(user: User): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar a "${user.username}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          cssClass: 'alert-delete-btn',
          handler: () => {
            this.api.deleteUser(user.id).subscribe({
              next: () => {
                this.loadUsers();
                if (this.pagedUsers().length === 0 && this.page() > 1) {
                  this.page.set(this.page() - 1);
                }
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }
}
