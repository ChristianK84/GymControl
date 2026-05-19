export interface Maestro {
  id: number;
  user_id?: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  telefono?: string;
  foto?: string;
  fecha_nacimiento?: string;
  genero_id?: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
