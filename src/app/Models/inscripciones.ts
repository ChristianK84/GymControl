export interface InscripcionAlumno {
  id: number;
  nombrecompleto: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  rama: string;
  fotografia?: string;
}

export interface Inscripcion {
  id: number;
  alumno_id: number;
  monto: number;
  porcentaje_beca: number;
  monto_final: number;
  anio: number;
  fecha_pago: string;
  fecha_inicio: string;
  fecha_fin: string;
  pagado: boolean;
  notas: string | null;
  registrado_por: number | null;
  created_at: string;
  alumno: InscripcionAlumno | null;
}
