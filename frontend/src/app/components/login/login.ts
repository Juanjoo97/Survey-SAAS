import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginForm: FormGroup;

  // Signals para manejar el estado
  error = signal<string>('');
  loading = signal<boolean>(false);
  showErrorModal = signal<boolean>(false);
  modalMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.error.set('');
      this.showErrorModal.set(false);
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          const redirect = this.authService.redirectUrl || '/dashboard';
          this.authService.redirectUrl = null;
          this.router.navigateByUrl(redirect);
        },
        error: (err) => {
          this.loading.set(false);
          this.showErrorModal.set(true);
          this.modalMessage.set(err.error?.message || 'Error al iniciar sesión');
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  closeModal() {
    this.showErrorModal.set(false);
  }
}