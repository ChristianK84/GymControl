import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonIcon, ToastController } from '@ionic/angular/standalone';
import { ApiService } from '../../Services/api-service';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, logInOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IonContent, IonIcon],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private toastController: ToastController
  ) {
    addIcons({ personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, logInOutline });
    this.loginForm = this.fb.group({
      user: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
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
        this.showToast('Inicio de sesión exitoso', 'success');
        console.log('Login exitoso:', res);
      },
      error: (err) => {
        if (err.status === 401) {
          this.showToast('Contraseña incorrecta', 'warning');
        } else {
          this.showToast('Ocurrió un error', 'danger');
        }
        console.log('Error en login:', err);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }
}
