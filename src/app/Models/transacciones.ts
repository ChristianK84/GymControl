export interface TransaccionAlumno {
  id: number;
  nombrecompleto: string;
  apellido_paterno: string;
}

export interface Transaccion {
  id: number;
  tipo_transaccion: number;
  categoria: string;
  subcategoria: string | null;
  descripcion: string | null;
  monto: number;
  fecha: string;
  membresia_id: number | null;
  alumno_id: number | null;
  registrado_por: number | null;
  created_at: string;
  alumno: TransaccionAlumno | null;
}

export interface ProfitMensual {
  mes: string;
  ingresos: number;
  gastos: number;
  profit: number;
}
