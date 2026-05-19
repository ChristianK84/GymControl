export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  created_at: string;
}

export interface Genero {
  id: number;
  nombre: string;
  created_at: string;
}

export interface GrupoEdad {
  id: number;
  nombre: string;
  descripcion?: string;
  edad_min?: number;
  edad_max?: number;
  created_at: string;
}

export interface EstadoMembresia {
  id: number;
  nombre: string;
  color?: string;
  descripcion?: string;
  created_at: string;
}
