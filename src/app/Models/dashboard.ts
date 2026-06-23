export interface AsistenciaSemanal {
  semana: string;
  valor: number;
}

export interface DashboardData {
  total_alumnos_activos: number;
  ingreso_mensual: number;
  tasa_asistencia_promedio: number;
  ausentismo_prolongado: number;
  asistencia_semanal: AsistenciaSemanal[];
}
