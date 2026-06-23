import { Component, signal, OnInit, inject } from '@angular/core';
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
import { ApiService } from '../../Services/api-service';

@Component({
  selector: 'app-dashboard-home',
  imports: [IonIcon],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css',
})
export class DashboardHome implements OnInit {
  private api = inject(ApiService);

  chartPeriod = signal('30dias');

  loading = signal(true);
  totalAlumnos = signal('---');
  ingresoMensual = signal('---');
  tasaAsistencia = signal('---');
  ausentismo = signal('---');
  barData = signal<{ week: string; value: number }[]>([]);

  ngOnInit(): void {
    this.api.getDashboardData().subscribe({
      next: (data) => {
        this.totalAlumnos.set(String(data.total_alumnos_activos));
        this.ingresoMensual.set(`$${Number(data.ingreso_mensual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
        this.tasaAsistencia.set(`${data.tasa_asistencia_promedio}%`);
        this.ausentismo.set(String(data.ausentismo_prolongado));
        this.barData.set(data.asistencia_semanal.map(s => ({ week: s.semana, value: s.valor })));
        this.loading.set(false);
      },
      error: () => {
        this.totalAlumnos.set('--');
        this.ingresoMensual.set('--');
        this.tasaAsistencia.set('--');
        this.ausentismo.set('--');
        this.loading.set(false);
      },
    });
  }

  readonly metricCards = [
    { icon: 'people-outline', value: this.totalAlumnos, label: 'Total de Alumnos Activos', trend: 0, trendUp: null },
    { icon: 'cash-outline', value: this.ingresoMensual, label: 'Ingreso Mensual', trend: 0, trendUp: null },
    { icon: 'checkmark-circle-outline', value: this.tasaAsistencia, label: 'Tasa de Asistencia Promedio', trend: 0, trendUp: null },
    { icon: 'warning-outline', value: this.ausentismo, label: 'Ausentismo Prolongado', trend: 0, trendUp: null, alert: true, suffix: 'Alumnos' },
  ];

  constructor() {
    addIcons({ peopleOutline, cashOutline, checkmarkCircleOutline, warningOutline, trendingUpOutline, removeOutline });
  }
}
