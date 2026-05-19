export interface TipoMembresia {
  id: number;
  nombre: string;
  descripcion?: string;
  costo_base: number;
  duracion_dias: number;
  color?: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
}

export interface Membresia {
  id: number;
  alumno_id: number;
  tipo_membresia_id: number;
  costo_real: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado_id: number;
  notas?: string;
  created_at: string;
  updated_at: string;
}
