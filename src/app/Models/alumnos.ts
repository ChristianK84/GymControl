export interface Tutor {
  id: number;
  alumno_id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  telefono: string;
  email: string;
}

export interface ContactoEmergencia {
  id: number;
  alumno_id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  telefono: string;
}

export interface FichaMedica {
  id: number;
  alumno_id: number;
  tipo_sangre: string | null;
  alergias: string | null;
  medicamentos: string | null;
  condiciones_medicas: string | null;
  nss: string | null;
}

export interface Alumno {
  id: number;
  nombrecompleto: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  rama: string;
  fecha_nacimiento: string;
  maestro_id: number;
  fotografia: string | null;
  fecha_inscripcion: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  tutor: Tutor | null;
  contacto_emergencia: ContactoEmergencia | null;
  ficha_medica: FichaMedica | null;
}
