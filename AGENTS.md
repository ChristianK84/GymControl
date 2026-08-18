# GymControl — Notas del agente

App híbrida Angular 20 + Ionic 8 para gestión de gimnasio (alumnos, maestros, usuarios, asistencias, membresías, documentos/firmas, expediente). Apunta a web, Electron (Windows) y Android vía Capacitor. UI en español (es-MX).

El backend vive en `https://gymcontrol-api-sne4.onrender.com/api/v1/`. Este repo es solo el frontend.

Cambios recientes: maestro solo cambia foto del alumno, envío de recibos por WhatsApp, documentos con/sin firma, pestaña Expediente, login flexible (trim + case-insensitive), vista de cards en directorio de alumnos.

---

## Vista de cards en el directorio de alumnos

El directorio `/dashboard/alumnos` (`Components/Alumnos/`) usa una grid de cards responsiva (en vez de tabla).

### Modelo (`src/app/Models/alumnos.ts`)

Cada `Alumno` incluye, además de las relaciones base (`tutor`, `contacto_emergencia`, `ficha_medica`), dos campos de resumen de membresía:

- `inscripcion: MembresiaResumen | null` — membresía con `tipo_membresia_id = 1` (Inscripción)
- `membresia: MembresiaResumen | null` — membresía regular con `tipo_membresia_id >= 2`

```typescript
export interface MembresiaResumen {
  is_active: boolean;
  fecha_vencimiento: string;
  esta_vencida: boolean;
  pagado: boolean;
  estado: string | null;
}
```

### Convención `tipo_membresia_id`

- `1` = Inscripción (registro inicial)
- `>= 2` = Membresía regular (Básica, Competitiva, Sábados, etc.)

### UI: 2 badges por alumno

Cada card muestra un badge de **Inscripción** (`alumno.inscripcion`) y otro de **Membresía** (`alumno.membresia`), con la misma lógica de 3 colores + gris:

| Estado | Color | Icono |
|---|---|---|
| Vigente + pagado | 🟢 verde (`#16a34a`) | ✓ `checkmark-circle-outline` |
| Vigente + impago | 🟠 naranja (`#c2410c`) | ⚠ `warning-outline` |
| Vencida / cancelada | 🔴 rojo | — |
| Sin inscripción / membresía | ⚫ gris | — |

Iconos registrados en `addIcons()`: `warningOutline`, `checkmarkCircleOutline`. Helpers en `alumnos.ts`: `esInactiva()`, `esPendiente()`, `esPagado()`.

### Card

Cada card muestra: avatar, nombre (`{{ alumno.nombrecompleto }} {{ alumno.apellido_paterno }}`) con wrap a 2 líneas (`line-clamp: 2`, `font-size: 0.85rem`), edad y rama, los 2 badges, y el maestro asignado.

### Componente compartido `Pagination`

En `src/app/Components/Shared/Pagination/` (`pagination.ts|html|css`). Paginación client-side reutilizable para listas; reemplaza los bucles `@for` de páginas.

---

## Comandos

| Tarea | Comando | Notas |
|---|---|---|
| Servidor dev (web) | `npm start` | Angular CLI en puerto 4200 |
| Servidor dev + Electron | `npm run electron:dev` | Usa `concurrently` + `wait-on http://localhost:4200`; setea `ELECTRON_DEV=true` |
| Build producción web | `npm run build` | SSR habilitado, output en `dist/GymControl/server` + `browser` |
| Build Capacitor (mobile) | `npm run capacitor:build` | Build con `--configuration capacitor` luego `npx cap sync` |
| Instalador Electron | `npm run electron:build` | Usa config `capacitor` + `electron-builder` → `release/` |
| Electron solo (sin Angular) | `npm run electron:dist` | Asume que `dist/` ya existe |
| Servidor SSR | `npm run serve:ssr:GymControl` | Express en `PORT` (default 4000) |
| Tests unitarios | `npm test` | **Karma + Chrome** (no Jest). Requiere Chrome instalado. CI usa flags headless. |
| Abrir Android Studio | `npm run capacitor:open` | |
| OTA bundle | `npm run ota:bundle` | Build capacitor + genera `.zip` para `@capgo/capacitor-updater` |

No hay script de lint ni typecheck separado. `ng build` ya verifica tipos y lint equivalentes vía el compilador strict de Angular.

### Configuraciones de build (`angular.json`)

- `production` (default) — SSR activo, output server, presupuesto 800kB warn / 2MB error
- `development` — sin SSR, file replacement intercambia `environment.ts` → `environment.development.ts`
- `capacitor` — output estático, presupuesto 2MB warn / 5MB error. Usado por `electron:build` y `capacitor:build`

---

## Arquitectura (no obvio por los nombres)

- **Change detection zoneless**: `provideZonelessChangeDetection()` en `app.config.ts`. No hay polyfill de `zone.js`; no agregues código basado en zone (ej. `setTimeout` no dispara detección automática).
- **Todos los componentes son standalone** — sin NgModules. Cada componente declara su arreglo `imports`.
- **DI funcional en todas partes**: usa `inject()` en vez de inyección por constructor.
- **Guards/interceptors funcionales**: `authGuard` (`CanActivateFn`) y `authInterceptor` (`HttpInterceptorFn`) — no basados en clases.
- **Uso intensivo de signals**: `signal()`, `computed()`. Prefiere signals sobre RxJS subjects para estado de componentes.
- **Todas las rutas son lazy**: cada ruta usa `loadComponent` con imports dinámicos. Las rutas nuevas deben seguir el mismo patrón.
- **UI en español**: locale `es-MX` registrado globalmente en `app.config.ts`. El formateo de fechas usa convenciones españolas. Mantén el texto de UI en español.
- **Soft delete**: las entidades usan booleano `is_deleted`. Usa `?include_deleted=true` en endpoints de listado para obtenerlos.

### Estructura de archivos

```
src/app/
  app.config.ts / app.routes.ts    # Providers + routing
  Models/                          # Interfaces TypeScript (sin decoradores)
  Services/
    api-service.ts                 # Todos los HTTP calls — fuente única de verdad para la API
    session.service.ts             # JWT + user en localStorage, signal isAuthenticated
  Guards/auth.guard.ts             # Redirige a /login si no está autenticado
  Interceptors/auth.interceptor.ts # Agrega Bearer token; 401 → limpia sesión
  Components/<Nombre>/<nombre>.ts|html|css
```

Cada carpeta de Componente tiene el componente, su template, estilos, y un modal hermano (ej. `alumnos.ts` + `alumno-form-modal.ts`) cuando el CRUD es vía modal.

---

## Flujo de autenticación

- `SessionService` guarda `auth_token` y `auth_user` en `localStorage`. Expone el signal `isAuthenticated`.
- `authInterceptor` clona cada request para agregar `Authorization: Bearer <token>`. En 401, limpia la sesión, setea `session_expired=1` en `sessionStorage`, y redirige a `/login`.
- `authGuard` verifica `session.isAuthenticated()` y retorna un UrlTree a `/login` en caso contrario.
- El componente Login lee `sessionStorage.getItem('session_expired')` para mostrar el toast de "sesión expirada".

---

## Entorno / API

`src/environments/environment.ts` contiene `apiUrl`. El archivo dev (`environment.development.ts`) actualmente apunta a la URL de **producción** en Render — la línea de `http://localhost:5000/api/v1/` está comentada. Descoméntala para apuntar dev a un backend local.

Cloudinary se usa para fotos de alumnos/maestros:
- Cloud name: `dyvqspnz7`
- Preset alumnos: `gymcontrol_upload`
- Preset maestros: `gymcontrol_upload_maestros`

La app sube directamente a Cloudinary vía `fetch` (sin SDK). Busca `cloudinary` en `alumno-form-modal.ts` y `maestro-form-modal.ts`.

---

## Convenciones

- Prettier: indentación 2 espacios, comillas simples, `printWidth: 100`, parser Angular HTML para `*.html`.
- TypeScript: `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch` activos. **`noPropertyAccessFromIndexSignature` es el que más molesta** — usa `obj['key']` no `obj.key` para index signatures.
- Angular: `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers` activos.
- No agregues comentarios a menos que se pidan.
- Sigue el estilo del archivo: los componentes usan arreglos `imports: [...]` y llamadas `inject()` en inicializadores de campo, no constructores.

---

## Gotchas

- `package-lock.json` está en **gitignore** (`.gitignore` línea 13). Solo se commitea `package.json`. No commitees el lockfile.
- `dist/`, `release/`, `out-tsc/`, `coverage/`, `.angular/`, `.env` están en gitignore.
- No hay directorio **e2e** ni configuración de ESLint.
- Los archivos de test (`*.spec.ts`) están colocalizados con el source. `tsconfig.app.json` los excluye del build browser; `tsconfig.spec.json` incluye todo `src/**/*.ts` para tests.
- Los tests necesitan un Chrome binary real. No hay configuración headless en `angular.json` — ejecutar en CI puede requerir la variable `CHROME_BIN` o un launcher Karma personalizado.
- `main` está seteado en `package.json` a `electron/main.js` para empaquetado de Electron; esto no afecta `ng serve`.
- `capacitor.config.ts` apunta `webDir` a `dist/GymControl/browser` — es el output de la configuración de build `capacitor` (coincide con `outputMode` estático). No lo apuntes al output del servidor SSR.
- El directorio `android/` es el proyecto Android generado por Capacitor. Ejecuta `npm run capacitor:build` después de cambios web para sincronizar.

---

## Dónde empezar al cambiar X

- **Agregar una nueva entidad/feature**: agrega un modelo en `Models/`, agrega métodos a `api-service.ts`, crea una carpeta en `Components/<Nombre>/`, agrega una ruta lazy en `app.routes.ts` (bajo `dashboard` si está protegida).
- **Agregar una nueva ruta protegida**: hija de `dashboard` en `app.routes.ts`; `authGuard` ya está en el padre.
- **Cambiar la URL base de la API**: edita `environment.ts` (y/o `environment.development.ts`).
- **Agregar un nuevo target de build**: edita `angular.json` → `projects.GymControl.architect.build.configurations`.
- **Agregar un nuevo script npm**: edita `package.json`; mantén el patrón `concurrently` + `wait-on` + `cross-env` usado en `electron:dev` si necesitas correr servidor y shell simultáneamente.

---

## Módulo: Firma Digital de Reglamentos (IMPLEMENTADO)

### Visión general

El tutor NO usa esta app. Todo el flujo del tutor es vía página web estática servida por el backend. Esta app solo tiene:

1. **Admin sube reglamento PDF** → subido a Cloudinary (preset `archivos`)
2. **Admin selecciona alumnos** → genera links JWT por alumno → envía emails a tutores
3. **Admin ve estado de firmas** (quién firmó, quién no, fecha, PDF firmado)

### Archivos existentes

| Archivo | Propósito |
|---------|-----------|
| `src/app/Components/Reglamentos/reglamentos.ts` | Página admin: listar reglamentos subidos |
| `src/app/Components/Reglamentos/upload-reglamento-modal.ts` | Modal para subir nuevo reglamento PDF |
| `src/app/Components/Reglamentos/edit-reglamento-modal.ts` | Modal para editar reglamento existente |
| `src/app/Components/Reglamentos/generar-links-modal.ts` | Modal para seleccionar alumnos y generar links JWT |
| `src/app/Components/Reglamentos/reglamento-firmas.ts` | Página admin: estado de firmas por alumno |
| `src/app/Models/reglamentos.ts` | Interfaces TypeScript |

### Modelos (`src/app/Models/reglamentos.ts`)

```typescript
export interface Reglamento {
  id: number;
  titulo: string;
  descripcion?: string;
  version: string;
  url_pdf_cloudinary: string;
  requires_firma: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FirmaReglamento {
  id: number;
  reglamento_id: number;
  reglamento_titulo?: string;
  requires_firma?: boolean;
  url_pdf_cloudinary?: string;
  alumno_id: number;
  tutor_id: number;
  alumno_nombre?: string;
  tutor_nombre?: string;
  url_pdf_firmado_cloudinary?: string;
  fecha_firma?: string;
  fecha_lectura?: string;
  expira_en: string;
  estado: 'pendiente' | 'firmado' | 'leido' | 'expirado';
  created_at: string;
}

export interface GenerarLinksPayload {
  reglamento_id: number;
  alumno_ids: number[];
}
```

### Métodos del ApiService (`Services/api-service.ts`)

Reglamentos (`:542-596`):
```typescript
getReglamentos(includeDeleted = false): Observable<Reglamento[]>
createReglamento(body: { titulo, descripcion?, version, url_pdf_cloudinary, cloudinary_public_id, requires_firma? }): Observable<Reglamento>
deleteReglamento(id: number): Observable<void>
updateReglamento(id: number, body: { titulo?, descripcion?, version?, is_active?, requires_firma?, url_pdf_cloudinary?, cloudinary_public_id? }): Observable<Reglamento>
generarLinks(body: GenerarLinksPayload): Observable<{ enviados: number; total: number; ya_firmados: number }>
getFirmas(reglamentoId?, alumnoId?, estado?): Observable<FirmaReglamento[]>
getFirmasByAlumno(alumnoId: number): Observable<FirmaReglamento[]>
```

Membresías:
```typescript
descargarReciboMembresia(id: number): Observable<Blob>  // GET /membresias/{id}/recibo.pdf
```

WhatsApp: `Services/whatsapp.service.ts` recibe una `Membresia`, descarga el recibo como Blob y usa `navigator.share` (fallback a descarga + `wa.me`).

### Rutas (`app.routes.ts`)

```typescript
{
  path: 'reglamentos',
  loadComponent: () => import('./Components/Reglamentos/reglamentos').then(m => m.Reglamentos),
  data: { roles: [1] },
},
{
  path: 'reglamentos/firmas',
  loadComponent: () => import('./Components/Reglamentos/reglamento-firmas').then(m => m.ReglamentoFirmas),
  data: { roles: [1] },
},
```

### Navegación (sidebar del Dashboard)

En `dashboard.ts` → `fullNavItems`:

```typescript
{ icon: 'document-text-outline', label: 'Documentos', route: '/dashboard/reglamentos', roles: [1], exact: true },
{ icon: 'checkmark-done-outline', label: 'Firmas', route: '/dashboard/reglamentos/firmas', roles: [1], exact: true },
```

Registrar iconos: `import { documentTextOutline, checkmarkDoneOutline } from 'ionicons/icons';` (ya registrado en `constructor()`)

---

## Permisos de edición del perfil del alumno

- **Admin** puede editar todos los campos desde `perfil-alumno` (botón "Editar Perfil").
- **Maestro** solo puede cambiar la fotografía (botón "Cambiar Foto"). El backend (`alumnos.py`) rechaza cualquier otro campo con 400.
- Modo foto-only usa el flag `photoEditing` y el método `savePhoto()` que solo envía `{ fotografia }`.

## Envío de recibos de membresía por WhatsApp

- Botón de WhatsApp en la lista de membresías (`membresias.ts/html`) y en cada tarjeta del perfil del alumno (tab Membresía).
- `Services/whatsapp.service.ts` normaliza el teléfono del tutor (`52` + 10 dígitos), descarga el PDF vía `descargarReciboMembresia()` y abre el share nativo; en web/Electron hace fallback a descarga + enlace `https://wa.me/<tel>?text=<msg>`.

## Documentos con/sin firma

- Cada `Reglamento` tiene `requires_firma: boolean` (default `true`).
- En upload/edit modal hay un checkbox "Este documento requiere firma del tutor".
- Si `requires_firma == false`, la página pública muestra solo el PDF y un botón "Confirmar lectura"; el backend guarda `fecha_lectura` y el estado pasa a `leido`.
- La tabla de Firmas y el Expediente distinguen estados `pendiente | firmado | leido | expirado`.

## Expediente del alumno

- Nueva pestaña "Expediente" en `perfil-alumno`, visible para admin y maestro.
- Carga `getFirmasByAlumno(alumnoId)` y muestra documentos firmados/leídos con sus fechas y links a PDFs.

## Login flexible

- El frontend hace `trim()` de username y password antes de enviar.
- El backend normaliza username a minúsculas y acepta la contraseña tal cual o en minúsculas (fallback).
