import { Routes } from '@angular/router';
import { authGuard } from './Guards/auth.guard';
import { roleGuard } from './Guards/role.guard';

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
    canActivateChild: [roleGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./Components/Dashboard/dashboard-home').then(
            (m) => m.DashboardHome,
          ),
        data: { roles: [1] },
      },
      {
        path: 'alumnos',
        loadComponent: () =>
          import('./Components/Alumnos/alumnos').then((m) => m.Alumnos),
        data: { roles: [1, 2] },
      },
      {
        path: 'alumnos/:id',
        loadComponent: () =>
          import('./Components/PerfilAlumno/perfil-alumno').then((m) => m.PerfilAlumno),
        data: { roles: [1, 2] },
      },
      {
        path: 'maestros',
        loadComponent: () =>
          import('./Components/Maestros/maestros').then((m) => m.Maestros),
        data: { roles: [1] },
      },
      {
        path: 'maestros/:id',
        loadComponent: () =>
          import('./Components/PerfilMaestro/perfil-maestro').then((m) => m.PerfilMaestro),
        data: { roles: [1] },
      },
      {
        path: 'asistencias',
        loadComponent: () =>
          import('./Components/Asistencias/asistencias').then((m) => m.Asistencias),
        data: { roles: [1, 2] },
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./Components/Users/users').then((m) => m.Users),
        data: { roles: [1] },
      },
      {
        path: 'tipos-membresia',
        loadComponent: () =>
          import('./Components/TiposMembresia/tipos-membresia').then(
            (m) => m.TiposMembresia,
          ),
        data: { roles: [1] },
      },
      {
        path: 'membresias',
        loadComponent: () =>
          import('./Components/Membresias/membresias').then((m) => m.Membresias),
        data: { roles: [1] },
      },
      {
        path: 'auditoria',
        loadComponent: () =>
          import('./Components/AuditLogs/audit-logs').then((m) => m.AuditLogs),
        data: { roles: [1] },
      },
      {
        path: 'publicar-version',
        loadComponent: () =>
          import('./Components/PublishVersion/publish-version').then(
            (m) => m.PublishVersion,
          ),
        data: { roles: [1] },
      },
    ],
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];
