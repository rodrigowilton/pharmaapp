import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin) return true;
  return router.parseUrl('/login');
};

export const farmaciaGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isFarmacia) return true;
  return router.parseUrl('/login');
};

export const clienteGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isCliente) return true;
  return router.parseUrl('/login');
};
