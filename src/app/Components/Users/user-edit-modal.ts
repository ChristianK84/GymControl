import { Component, inject, Input, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  private modalCtrl = inject(ModalController);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  get isEdit(): boolean {
    return !!this.user;
  }

  fullName = '';
  username = '';
  roleId: number | undefined = undefined;
  isActive = true;
  createdAt = '';
  password = '';

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
    this.cdr.detectChanges();
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
    if (!this.validate()) {
      return;
    }

    if (this.isEdit) {
      this.api
        .updateUser(this.user!.id, {
          username: this.username || undefined,
          full_name: this.fullName || null,
          role_id: this.roleId!,
          is_active: this.isActive,
          password: this.password || undefined,
        })
        .subscribe({
          next: (updated) => this.modalCtrl.dismiss(updated, 'saved'),
        });
    } else {
      this.api
        .createUser({
          username: this.username,
          password: this.password,
          full_name: this.fullName || null,
          role_id: this.roleId!,
        })
        .subscribe({
          next: (created) => this.modalCtrl.dismiss(created, 'saved'),
        });
    }
  }
}
