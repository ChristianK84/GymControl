export interface Transaccion {
  id: number;
  tipo_transaccion: number;
  categoria: string;
  subcategoria?: string;
  descripcion?: string;
  monto: number;
  fecha: string;
  membresia_id?: number;
  alumno_id?: number;
  registrado_por?: number;
  created_at: string;
}
