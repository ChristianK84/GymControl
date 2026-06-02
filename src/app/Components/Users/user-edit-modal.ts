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
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
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

  get isEdit(): boolean {
    return !!this.user;
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
  errors: Record<string, string> = {};

  constructor() {
    addIcons({ closeOutline, eyeOutline, eyeOffOutline });
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
    }
    this.selectedMaestroId = this.maestroVinculado?.id ?? null;
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
