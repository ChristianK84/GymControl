export interface MaestroAsistencias {
  maestro_id: number;
  maestro_nombre: string;
  maestro_apellido_paterno: string;
  total_general: number;
  semanas: Record<string, number>;
}

export interface AsistenciasPorMaestroResponse {
  fecha_inicio_global: string;
  fecha_fin_global: string;
  semanas: string[];
  maestros: MaestroAsistencias[];
}
