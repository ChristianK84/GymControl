export interface User {
  id: number;
  username: string;
  password_hash: string;
  full_name?: string;
  role_id: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
