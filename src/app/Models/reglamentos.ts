export interface Reglamento {
  id: number;
  titulo: string;
  descripcion?: string;
  version: string;
  url_pdf_cloudinary: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FirmaReglamento {
  id: number;
  reglamento_id: number;
  alumno_id: number;
  tutor_id: number;
  alumno_nombre?: string;
  tutor_nombre?: string;
  url_pdf_firmado_cloudinary?: string;
  fecha_firma?: string;
  expira_en: string;
  estado: 'pendiente' | 'firmado' | 'expirado';
  created_at: string;
}

export interface GenerarLinksPayload {
  reglamento_id: number;
  alumno_ids: number[];
}
