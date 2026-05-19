import { Component, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  cashOutline,
  checkmarkCircleOutline,
  warningOutline,
  trendingUpOutline,
  removeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard-home',
  imports: [IonIcon],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css',
})
export class DashboardHome {
  chartPeriod = signal('30dias');

  readonly metricCards = [
    { icon: 'people-outline', value: '428', label: 'Total de Alumnos Activos', trend: 12, trendUp: true },
    { icon: 'cash-outline', value: '$32,450', label: 'Ingreso Mensual', trend: 8.4, trendUp: true },
    { icon: 'checkmark-circle-outline', value: '94.2%', label: 'Tasa de Asistencia Promedio', trend: 0, trendUp: null },
    { icon: 'warning-outline', value: '14', label: 'Ausentismo Prolongado', trend: 0, trendUp: null, alert: true, suffix: 'Alumnos' },
  ];

  readonly barData = [
    { week: 'Sem 1', value: 80 },
    { week: 'Sem 2', value: 85 },
    { week: 'Sem 3', value: 75 },
    { week: 'Sem 4', value: 90 },
    { week: 'Sem 5', value: 95 },
  ];

  constructor() {
    addIcons({ peopleOutline, cashOutline, checkmarkCircleOutline, warningOutline, trendingUpOutline, removeOutline });
  }
}
