export interface AsistenciaAlumno {
  id: number;
  nombrecompleto: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  rama: string;
}

export interface AsistenciaMaestro {
  id: number;
  nombre: string;
  apellido_paterno: string;
}

export interface Asistencia {
  id: number;
  alumno_id: number;
  maestro_id: number;
  fecha: string;
  asistio: boolean;
  notas: string | null;
  registrado_por: number | null;
  created_at: string;
  alerta_impago: string | null;
  alumno: AsistenciaAlumno | null;
  maestro: AsistenciaMaestro | null;
}
