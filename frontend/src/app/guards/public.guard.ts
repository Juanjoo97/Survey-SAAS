import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const publicGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Si ya está autenticado, redirigir al dashboard
    if (authService.isAuthenticated()) {
        router.navigate(['/dashboard']);
        return false;
    }

    // Si no está autenticado, permitir acceso a login/register
    return true;
};
