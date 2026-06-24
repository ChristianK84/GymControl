import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonIcon, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { ApiService } from '../../Services/api-service';
import { SessionService } from '../../Services/session.service';
import { APP_VERSION } from '../../version';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, logInOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IonContent, IonIcon, IonSpinner],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  readonly appVersion = APP_VERSION;
  loginForm: FormGroup;
  hidePassword = signal(true);
  loggingIn = signal(false);

  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private session = inject(SessionService);
  private toastController = inject(ToastController);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    addIcons({ personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, logInOutline });
    this.loginForm = this.fb.group({
      user: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loginForm.reset();
    this.loggingIn.set(false);

    if (isPlatformBrowser(this.platformId) && sessionStorage.getItem('session_expired')) {
      sessionStorage.removeItem('session_expired');
      setTimeout(() => this.showToast('Su sesión ha expirado', 'warning'), 300);
    }
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const icons: Record<string, string> = { success: 'checkmark-circle', warning: 'warning', danger: 'close-circle' };
    const toast = await this.toastController.create({
      message, duration: 3000, color, position: 'top',
      icon: icons[color],
      cssClass: 'custom-toast',
    });
    toast.present();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loggingIn.set(true);
    const { user, password } = this.loginForm.value;
    this.apiService.login(user, password).subscribe({
      next: (res) => {
        this.session.saveSession(res);
        (document.activeElement as HTMLElement)?.blur();
        this.showToast('Inicio de sesión exitoso', 'success');
        const destino = res.role_id === 2 ? '/dashboard/alumnos' : '/dashboard';
        this.router.navigate([destino], { replaceUrl: true });
      },
      error: (err) => {
        this.loggingIn.set(false);
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
