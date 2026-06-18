export interface AuditLogEntry {
  id: number;
  user_id: number;
  action: string;
  entity: string;
  entity_id: number | null;
  descripcion: string;
  created_at: string;
  user_nombre: string | null;
}
