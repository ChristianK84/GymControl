export interface User {
  id: number;
  username: string;
  full_name?: string;
  role_id: number;
  is_active: boolean;
  is_deleted: boolean;
  failed_login_attempts?: number;
  locked_until?: string | null;
  created_at: string;
  updated_at: string;
}
