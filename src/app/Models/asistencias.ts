export interface Asistencia {
  id: number;
  alumno_id: number;
  maestro_id: number;
  fecha: string;
  asistio: boolean;
  notas?: string;
  registrado_por?: number;
  created_at: string;
}
