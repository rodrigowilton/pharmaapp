import { Routes } from '@angular/router';
import { adminGuard, farmaciaGuard, clienteGuard } from './guards/guards';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then(m => m.LoginPage) },

  { path: 'admin/dashboard',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/dashboard/dashboard.page').then(m => m.AdminDashboardPage) },

  { path: 'admin/farmacias',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/farmacias/farmacias.page').then(m => m.FarmaciasPage) },

  { path: 'farmacia/dashboard',
    canActivate: [farmaciaGuard],
    loadComponent: () => import('./pages/farmacia/dashboard/dashboard.page').then(m => m.FarmaciaDashboardPage) },

  { path: 'farmacia/clientes',
    canActivate: [farmaciaGuard],
    loadComponent: () => import('./pages/farmacia/clientes/clientes.page').then(m => m.ClientesPage) },

  { path: 'farmacia/produtos',
    canActivate: [farmaciaGuard],
    loadComponent: () => import('./pages/farmacia/produtos/produtos.page').then(m => m.ProdutosPage) },

  { path: 'farmacia/pedidos',
    canActivate: [farmaciaGuard],
    loadComponent: () => import('./pages/farmacia/pedidos/pedidos.page').then(m => m.PedidosPage) },

  { path: 'cliente/home',
    canActivate: [clienteGuard],
    loadComponent: () => import('./pages/cliente/home/home.page').then(m => m.ClienteHomePage) },

  { path: '**', redirectTo: 'login' }
];
