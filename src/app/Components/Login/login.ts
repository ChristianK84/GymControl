import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../Services/api-service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      user: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { user, password } = this.loginForm.value;
    this.apiService.login(user, password).subscribe({
      next: (res) => {
        this.toastr.success('Inicio de sesión exitoso');
        console.log('Login exitoso:', res);
      },
      error: (err) => {
        if (err.status === 401) {
          this.toastr.warning('Contraseña incorrecta');
        } else {
          this.toastr.error('Ocurrió un error');
        }
        console.log('Error en login:', err);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }
}
