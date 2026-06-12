import { Component, inject, Input, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Observable } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonFooter,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonItem,
  IonLabel,
  IonAvatar,
  IonSpinner,
  ModalController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, eyeOutline, eyeOffOutline, lockOpenOutline, keyOutline, trashOutline } from 'ionicons/icons';
import { ApiService } from '../../Services/api-service';
import { User } from '../../Models/users';
import { Rol } from '../../Models/catalogs';
import { Maestro } from '../../Models/maestros';

@Component({
  selector: 'app-user-form-modal',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonFooter,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonItem,
    IonLabel,
    IonAvatar,
    IonSpinner,
  ],
  templateUrl: './user-edit-modal.html',
  styleUrl: './user-edit-modal.css',
})
export class UserFormModal implements OnInit {
  @Input() user?: User;
  @Input() roles!: Rol[];
  @Input() maestros: Maestro[] = [];

  private modalCtrl = inject(ModalController);
  private api = inject(ApiService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  get isEdit(): boolean {
    return !!this.user;
  }

  get failedAttempts(): number {
    return this.user?.failed_login_attempts ?? 0;
  }

  get isLocked(): boolean {
    if (!this.user?.locked_until) return false;
    return new Date(this.user.locked_until) > new Date();
  }

  get lockedUntilText(): string {
    if (!this.isLocked || !this.user?.locked_until) return '';
    const d = new Date(this.user.locked_until);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  get maestroVinculado(): Maestro | undefined {
    if (!this.user) return undefined;
    return this.maestros.find(m => m.user_id === this.user!.id);
  }

  fullName = '';
  username = '';
  roleId: number | undefined = undefined;
  isActive = true;
  createdAt = '';
  password = '';
  selectedMaestroId: number | null = null;

  showPassword = signal(false);
  unlocking = signal(false);
  resettingPassword = signal(false);
  errors: Record<string, string> = {};

  constructor() {
    addIcons({ closeOutline, eyeOutline, eyeOffOutline, lockOpenOutline, keyOutline, trashOutline });
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  ngOnInit(): void {
    if (this.user) {
      this.fullName = this.user.full_name ?? '';
      this.username = this.user.username;
      this.roleId = this.user.role_id;
      this.isActive = this.user.is_active;
      this.createdAt = new DatePipe('es-MX').transform(
        this.user.created_at,
        "d 'de' MMMM 'del' yyyy",
      )!;
      this.selectedMaestroId = this.maestroVinculado?.id ?? null;

      this.api.getUser(this.user.id).subscribe({
        next: (fresh) => {
          this.fullName = fresh.full_name ?? '';
          this.username = fresh.username;
          this.roleId = fresh.role_id;
          this.isActive = fresh.is_active;
          this.createdAt = new DatePipe('es-MX').transform(
            fresh.created_at,
            "d 'de' MMMM 'del' yyyy",
          )!;
          this.selectedMaestroId = this.maestroVinculado?.id ?? null;
        },
      });
    } else {
      this.selectedMaestroId = null;
    }
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  private validate(): boolean {
    this.errors = {};

    if (!this.fullName.trim()) {
      this.errors['fullName'] = 'El nombre completo es requerido';
    }
    if (!this.username.trim()) {
      this.errors['username'] = 'El nombre de usuario es requerido';
    }
    if (this.roleId == null) {
      this.errors['roleId'] = 'Seleccione un rol';
    }
    if (!this.isEdit && !this.password) {
      this.errors['password'] = 'La contraseña es requerida';
    }

    return Object.keys(this.errors).length === 0;
  }

  save(): void {
    if (!this.validate()) return;

    const obs = this.isEdit
      ? this.api.updateUser(this.user!.id, {
          username: this.username || undefined,
          full_name: this.fullName || null,
          role_id: this.roleId!,
          is_active: this.isActive,
          password: this.password || undefined,
        })
      : this.api.createUser({
          username: this.username,
          password: this.password,
          full_name: this.fullName || null,
          role_id: this.roleId!,
        });

    obs.subscribe({
      next: (result) => {
        const userId = (result as User).id;
        this.linkMaestro(userId).subscribe({
          next: () => this.modalCtrl.dismiss(result, 'saved'),
        });
      },
    });
  }

  async deleteUser(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar a "${this.user!.username}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          cssClass: 'alert-delete-btn',
          handler: () => {
            this.api.deleteUser(this.user!.id).subscribe({
              next: () => this.modalCtrl.dismiss(null, 'deleted'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async unlockUser(): Promise<void> {
    this.unlocking.set(true);
    this.api.updateUser(this.user!.id, {
      locked_until: null,
      failed_login_attempts: 0,
    }).subscribe({
      next: () => {
        this.unlocking.set(false);
        this.modalCtrl.dismiss(null, 'unlocked');
      },
      error: () => this.unlocking.set(false),
    });
  }

  async resetPassword(): Promise<void> {
    this.resettingPassword.set(true);
    this.api.resetPassword(this.user!.id).subscribe({
      next: (res) => {
        this.resettingPassword.set(false);
        this.alertCtrl.create({
          header: 'Contraseña restablecida',
          message: `La nueva contraseña es: <strong>${res.new_password}</strong>`,
          buttons: [
            {
              text: 'Copiar y cerrar',
              handler: () => {
                navigator.clipboard.writeText(res.new_password);
                this.modalCtrl.dismiss(null, 'reset');
              },
            },
          ],
        }).then(a => a.present());
      },
      error: () => this.resettingPassword.set(false),
    });
  }

  private linkMaestro(userId: number): Observable<any> {
    const oldId = this.maestroVinculado?.id ?? null;
    const newId = this.selectedMaestroId;

    const ops: Observable<any>[] = [];
    if (oldId != null && oldId !== newId) {
      ops.push(this.api.updateMaestro(oldId, { user_id: null }));
    }
    if (newId != null && newId !== oldId) {
      ops.push(this.api.updateMaestro(newId, { user_id: userId }));
    }
    return ops.length ? forkJoin(ops) : of(null);
  }
}
