import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonIcon, ToastController } from '@ionic/angular/standalone';
import { ApiService } from '../../Services/api-service';
import { SessionService } from '../../Services/session.service';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, logInOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IonContent, IonIcon],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  hidePassword = signal(true);

  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private session = inject(SessionService);
  private toastController = inject(ToastController);
  private router = inject(Router);

  constructor() {
    addIcons({ personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, logInOutline });
    this.loginForm = this.fb.group({
      user: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    toast.present();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { user, password } = this.loginForm.value;
    this.apiService.login(user, password).subscribe({
      next: (res) => {
        this.session.saveSession(res);
        (document.activeElement as HTMLElement)?.blur();
        this.showToast('Inicio de sesión exitoso', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        if (err.status === 401) {
          this.showToast('Contraseña incorrecta', 'warning');
        } else {
          this.showToast('Ocurrió un error', 'danger');
        }
      },
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }
}
