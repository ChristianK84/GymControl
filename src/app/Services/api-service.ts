import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenResponse } from '../Models/token-response';
import { Rol } from '../Models/catalogs';
import { User } from '../Models/users';
import { Alumno } from '../Models/alumnos';
import { Maestro } from '../Models/maestros';
import { Asistencia } from '../Models/asistencias';
import { Membresia, TipoMembresia } from '../Models/membresias';
import { Transaccion, ProfitMensual } from '../Models/transacciones';
import { EstadoMembresia } from '../Models/catalogs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Health (sin auth) ──

  health(): Observable<{ status: string; message: string }> {
    return this.http.get<{ status: string; message: string }>(
      `${this.baseUrl}health`,
    );
  }

  // ── Auth (sin auth) ──

  login(
    username: string,
    password: string,
  ): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.baseUrl}auth/login`, {
      username,
      password,
    });
  }

  // ── Roles ──

  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.baseUrl}roles/`);
  }

  getRol(rolId: number): Observable<Rol> {
    return this.http.get<Rol>(`${this.baseUrl}roles/${rolId}`);
  }

  // ── Users ──

  getUsers(includeDeleted = false): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}users/`, {
      params: { include_deleted: includeDeleted },
    });
  }

  getUser(userId: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}users/${userId}`);
  }

  createUser(body: {
    username: string;
    password: string;
    full_name?: string | null;
    role_id: number;
  }): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}users/`, body);
  }

  updateUser(
    userId: number,
    body: {
      username?: string;
      full_name?: string | null;
      role_id?: number;
      is_active?: boolean;
      password?: string;
    },
  ): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}users/${userId}`, body);
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}users/${userId}`);
  }

  // ── Maestros ──

  getMaestros(includeDeleted = false): Observable<Maestro[]> {
    return this.http.get<Maestro[]>(`${this.baseUrl}maestros/`, {
      params: { include_deleted: includeDeleted },
    });
  }

  getMaestro(maestroId: number): Observable<Maestro> {
    return this.http.get<Maestro>(`${this.baseUrl}maestros/${maestroId}`);
  }

  createMaestro(body: {
    user_id?: number | null;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string | null;
    telefono?: string | null;
    foto?: string | null;
    fecha_nacimiento?: string | null;
  }): Observable<Maestro> {
    return this.http.post<Maestro>(`${this.baseUrl}maestros/`, body);
  }

  updateMaestro(
    maestroId: number,
    body: {
      user_id?: number | null;
      nombre?: string;
      apellido_paterno?: string;
      apellido_materno?: string | null;
      telefono?: string | null;
      foto?: string | null;
      fecha_nacimiento?: string | null;
      is_active?: boolean;
    },
  ): Observable<Maestro> {
    return this.http.put<Maestro>(
      `${this.baseUrl}maestros/${maestroId}`,
      body,
    );
  }

  deleteMaestro(maestroId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}maestros/${maestroId}`);
  }

  // ── Alumnos ──

  getAlumnos(includeDeleted = false): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(`${this.baseUrl}alumnos/`, {
      params: { include_deleted: includeDeleted },
    });
  }

  getAlumno(alumnoId: number): Observable<Alumno> {
    return this.http.get<Alumno>(`${this.baseUrl}alumnos/${alumnoId}`);
  }

  createAlumno(body: {
    nombrecompleto: string;
    apellido_paterno: string;
    apellido_materno?: string | null;
    rama: string;
    fecha_nacimiento: string;
    maestro_id: number;
    fotografia?: string | null;
    fecha_inscripcion: string;
    tutor: {
      nombre: string;
      apellido_paterno: string;
      apellido_materno?: string | null;
      telefono: string;
      email: string;
    };
    contacto_emergencia: {
      nombre: string;
      apellido_paterno: string;
      apellido_materno?: string | null;
      telefono: string;
    };
    ficha_medica: {
      tipo_sangre?: string | null;
      alergias?: string | null;
      medicamentos?: string | null;
      condiciones_medicas?: string | null;
      nss?: string | null;
    };
  }): Observable<Alumno> {
    return this.http.post<Alumno>(`${this.baseUrl}alumnos/`, body);
  }

  updateAlumno(
    alumnoId: number,
    body: {
      nombrecompleto?: string;
      apellido_paterno?: string;
      apellido_materno?: string | null;
      rama?: string;
      fecha_nacimiento?: string;
      maestro_id?: number;
      fotografia?: string | null;
      fecha_inscripcion?: string;
      is_active?: boolean;
      tutor?: {
        nombre?: string;
        apellido_paterno?: string;
        apellido_materno?: string | null;
        telefono?: string;
        email?: string;
      };
      contacto_emergencia?: {
        nombre?: string;
        apellido_paterno?: string;
        apellido_materno?: string | null;
        telefono?: string;
      };
      ficha_medica?: {
        tipo_sangre?: string | null;
        alergias?: string | null;
        medicamentos?: string | null;
        condiciones_medicas?: string | null;
        nss?: string | null;
      };
    },
  ): Observable<Alumno> {
    return this.http.put<Alumno>(
      `${this.baseUrl}alumnos/${alumnoId}`,
      body,
    );
  }

  deleteAlumno(alumnoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}alumnos/${alumnoId}`);
  }

  // ── Asistencias ──

  getAsistencias(filters?: {
    alumno_id?: number;
    maestro_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(`${this.baseUrl}asistencias/`, {
      params: { ...filters },
    });
  }

  getAsistencia(asistenciaId: number): Observable<Asistencia> {
    return this.http.get<Asistencia>(
      `${this.baseUrl}asistencias/${asistenciaId}`,
    );
  }

  createAsistencia(body: {
    alumno_id: number;
    maestro_id: number;
    fecha: string;
    asistio: boolean;
    notas?: string | null;
    registrado_por?: number | null;
  }): Observable<Asistencia> {
    return this.http.post<Asistencia>(`${this.baseUrl}asistencias/`, body);
  }

  updateAsistencia(
    asistenciaId: number,
    body: {
      asistio?: boolean;
      notas?: string | null;
      maestro_id?: number;
    },
  ): Observable<Asistencia> {
    return this.http.put<Asistencia>(
      `${this.baseUrl}asistencias/${asistenciaId}`,
      body,
    );
  }

  deleteAsistencia(asistenciaId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}asistencias/${asistenciaId}`,
    );
  }

  // ── Estados de Membresía ──

  getEstadosMembresia(): Observable<EstadoMembresia[]> {
    return this.http.get<EstadoMembresia[]>(
      `${this.baseUrl}estados-membresia/`,
    );
  }

  getEstadoMembresia(id: number): Observable<EstadoMembresia> {
    return this.http.get<EstadoMembresia>(
      `${this.baseUrl}estados-membresia/${id}`,
    );
  }

  // ── Tipos de Membresía ──

  getTiposMembresia(filters?: {
    include_inactive?: boolean;
    include_deleted?: boolean;
  }): Observable<TipoMembresia[]> {
    return this.http.get<TipoMembresia[]>(`${this.baseUrl}tipos-membresia/`, {
      params: { ...filters },
    });
  }

  getTipoMembresia(id: number): Observable<TipoMembresia> {
    return this.http.get<TipoMembresia>(
      `${this.baseUrl}tipos-membresia/${id}`,
    );
  }

  createTipoMembresia(body: {
    nombre: string;
    costo_base: number;
    duracion_dias: number;
    dias_incluidos: string;
    dias_por_semana?: number | null;
    horas_por_clase?: number | null;
    nivel_competitivo?: boolean;
    color?: string | null;
    descripcion?: string | null;
  }): Observable<TipoMembresia> {
    return this.http.post<TipoMembresia>(
      `${this.baseUrl}tipos-membresia/`,
      body,
    );
  }

  updateTipoMembresia(
    id: number,
    body: {
      nombre?: string;
      costo_base?: number;
      duracion_dias?: number;
      dias_incluidos?: string;
      dias_por_semana?: number | null;
      horas_por_clase?: number | null;
      nivel_competitivo?: boolean;
      color?: string | null;
      descripcion?: string | null;
      is_active?: boolean;
    },
  ): Observable<TipoMembresia> {
    return this.http.put<TipoMembresia>(
      `${this.baseUrl}tipos-membresia/${id}`,
      body,
    );
  }

  deleteTipoMembresia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}tipos-membresia/${id}`);
  }

  // ── Membresías ──

  getMembresias(filters?: {
    alumno_id?: number;
    estado_id?: number;
    vencidas?: boolean;
    pagado?: boolean;
  }): Observable<Membresia[]> {
    return this.http.get<Membresia[]>(`${this.baseUrl}membresias/`, {
      params: { ...filters },
    });
  }

  getMembresia(id: number): Observable<Membresia> {
    return this.http.get<Membresia>(`${this.baseUrl}membresias/${id}`);
  }

  createMembresia(body: {
    alumno_id: number;
    tipo_membresia_id: number;
    costo_real: number;
    porcentaje_beca?: number;
    fecha_inicio: string;
    fecha_vencimiento: string;
    pagado: boolean;
    notas?: string | null;
  }): Observable<Membresia> {
    return this.http.post<Membresia>(`${this.baseUrl}membresias/`, body);
  }

  updateMembresia(
    id: number,
    body: {
      tipo_membresia_id?: number;
      costo_real?: number;
      porcentaje_beca?: number;
      fecha_inicio?: string;
      fecha_vencimiento?: string;
      estado_id?: number;
      pagado?: boolean;
      notas?: string | null;
    },
  ): Observable<Membresia> {
    return this.http.put<Membresia>(
      `${this.baseUrl}membresias/${id}`,
      body,
    );
  }

  deleteMembresia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}membresias/${id}`);
  }

  // ── Transacciones ──

  getTransacciones(filters?: {
    tipo_transaccion?: number;
    categoria?: string;
    alumno_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Observable<Transaccion[]> {
    return this.http.get<Transaccion[]>(`${this.baseUrl}transacciones/`, {
      params: { ...filters },
    });
  }

  getTransaccion(id: number): Observable<Transaccion> {
    return this.http.get<Transaccion>(
      `${this.baseUrl}transacciones/${id}`,
    );
  }

  createTransaccion(body: {
    tipo_transaccion: number;
    categoria: string;
    subcategoria?: string | null;
    descripcion?: string | null;
    monto: number;
    fecha: string;
    membresia_id?: number | null;
    alumno_id?: number | null;
    registrado_por?: number | null;
  }): Observable<Transaccion> {
    return this.http.post<Transaccion>(
      `${this.baseUrl}transacciones/`,
      body,
    );
  }

  updateTransaccion(
    id: number,
    body: {
      tipo_transaccion?: number;
      categoria?: string;
      subcategoria?: string | null;
      descripcion?: string | null;
      monto?: number;
      fecha?: string;
      membresia_id?: number | null;
      alumno_id?: number | null;
    },
  ): Observable<Transaccion> {
    return this.http.put<Transaccion>(
      `${this.baseUrl}transacciones/${id}`,
      body,
    );
  }

  deleteTransaccion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}transacciones/${id}`);
  }

  getProfitMensual(anio: number): Observable<ProfitMensual[]> {
    return this.http.get<ProfitMensual[]>(
      `${this.baseUrl}transacciones/reportes/profit`,
      { params: { anio } },
    );
  }
}
