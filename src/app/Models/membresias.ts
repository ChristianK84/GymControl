// ===== Tipos de Membresía =====
export interface TipoMembresia {
  id: number;
  nombre: string;
  descripcion: string | null;
  costo_base: number;
  duracion_dias: number;
  dias_incluidos: string;
  dias_por_semana: number | null;
  horas_por_clase: number | null;
  nivel_competitivo: boolean;
  color: string | null;
  permite_dias_extra: boolean;
  costo_dia_extra: number | null;
  bloquear_impago: boolean;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
}

// ===== Membresías =====
export interface MembresiaAlumno {
  id: number;
  nombrecompleto: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  rama: string;
  fotografia?: string;
}

export interface MembresiaTipoPlan {
  id: number;
  nombre: string;
  costo_base: number;
  duracion_dias: number;
  dias_incluidos: string;
  color: string | null;
}

export interface MembresiaEstado {
  id: number;
  nombre: string;
  color: string | null;
}

export interface Membresia {
  id: number;
  alumno_id: number;
  tipo_membresia_id: number;
  costo_real: number;
  porcentaje_beca: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado_id: number;
  pagado: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
  alumno: MembresiaAlumno | null;
  tipo_membresia: MembresiaTipoPlan | null;
  estado: MembresiaEstado | null;
}
