export interface MaestroUser {
  id: number;
  username: string;
  full_name: string | null;
  role_id: number;
}

export interface Maestro {
  id: number;
  user_id: number | null;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  telefono: string | null;
  foto: string | null;
  fecha_nacimiento: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user: MaestroUser | null;
}
