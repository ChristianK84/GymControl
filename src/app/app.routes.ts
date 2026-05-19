import { Routes } from '@angular/router';
import { authGuard } from './Guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./Components/Login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./Components/Dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./Components/Dashboard/dashboard-home').then(
            (m) => m.DashboardHome,
          ),
      },
      {
        path: 'alumnos',
        loadComponent: () =>
          import('./Components/Alumnos/alumnos').then((m) => m.Alumnos),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./Components/Users/users').then((m) => m.Users),
      },
    ],
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];
