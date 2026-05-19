import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api-service';
import { environment } from '../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── Health ──

  it('should GET health', () => {
    service.health().subscribe((res) => {
      expect(res.status).toBe('ok');
    });
    const req = httpMock.expectOne(`${environment.apiUrl}health`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'ok', message: 'running' });
  });

  // ── Auth ──

  it('should POST login', () => {
    const mock = { access_token: 'tk', token_type: 'bearer', user_id: 1, username: 'u', full_name: null, role_id: 2 };
    service.login('u', 'p').subscribe((r) => expect(r.access_token).toBe('tk'));
    const req = httpMock.expectOne(`${environment.apiUrl}auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'u', password: 'p' });
    req.flush(mock);
  });

  // ── Roles ──

  it('should GET all roles', () => {
    service.getRoles().subscribe((r) => expect(r.length).toBe(2));
    const req = httpMock.expectOne(`${environment.apiUrl}roles/`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, nombre: 'Admin', created_at: '' }, { id: 2, nombre: 'Maestro', created_at: '' }]);
  });

  it('should GET one rol', () => {
    service.getRol(1).subscribe((r) => expect(r.nombre).toBe('Admin'));
    const req = httpMock.expectOne(`${environment.apiUrl}roles/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1, nombre: 'Admin', created_at: '' });
  });

  // ── Users ──

  it('should GET users without deleted', () => {
    service.getUsers().subscribe((r) => expect(r.length).toBe(1));
    const req = httpMock.expectOne(`${environment.apiUrl}users/?include_deleted=false`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, username: 'u', password_hash: '', full_name: null, role_id: 1, is_active: true, is_deleted: false, created_at: '', updated_at: '' }]);
  });

  it('should GET users with deleted', () => {
    service.getUsers(true).subscribe((r) => expect(r.length).toBe(2));
    const req = httpMock.expectOne(`${environment.apiUrl}users/?include_deleted=true`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }, { id: 2 }] as any);
  });

  it('should GET one user', () => {
    service.getUser(1).subscribe((r) => expect(r.username).toBe('admin'));
    const req = httpMock.expectOne(`${environment.apiUrl}users/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1, username: 'admin', password_hash: '', full_name: null, role_id: 1, is_active: true, is_deleted: false, created_at: '', updated_at: '' });
  });

  it('should POST create user', () => {
    const body = { username: 'nuevo', password: 'pass', full_name: 'Nuevo User', role_id: 2 };
    service.createUser(body).subscribe((r) => expect(r.username).toBe('nuevo'));
    const req = httpMock.expectOne(`${environment.apiUrl}users/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 2, username: 'nuevo', password_hash: '', full_name: 'Nuevo User', role_id: 2, is_active: true, is_deleted: false, created_at: '', updated_at: '' });
  });

  it('should PUT update user', () => {
    const body = { full_name: 'Actualizado' };
    service.updateUser(1, body).subscribe((r) => expect(r.full_name).toBe('Actualizado'));
    const req = httpMock.expectOne(`${environment.apiUrl}users/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 1, username: 'admin', password_hash: '', full_name: 'Actualizado', role_id: 1, is_active: true, is_deleted: false, created_at: '', updated_at: '' });
  });

  it('should DELETE user (204)', () => {
    service.deleteUser(1).subscribe((r) => expect(r).toBeNull());
    const req = httpMock.expectOne(`${environment.apiUrl}users/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
