# GymControl

Aplicación híbrida para gestión de gimnasios: control de alumnos, maestros, usuarios, asistencias y membresías.

## Stack

- **Angular 20** + **Ionic 8** — UI responsive y componentes nativos
- **Capacitor** — despliegue a Android
- **Electron** — aplicación de escritorio para Windows
- **SSR** (Angular Universal) — renderizado del lado del servidor
- **Karma + Jasmine** — tests unitarios

## Características

- **CRUD completo** — Alumnos, Maestros, Usuarios, Membresías, Asistencias, Transacciones, Auditoría
- **Firma Digital de Reglamentos** — Admin sube PDF, genera links JWT, envía emails a tutores, tutores firman en navegador (canvas), PDF firmado guardado en Cloudinary
- **Documentos solo lectura** — Algunos documentos no requieren firma; el tutor confirma lectura y queda registrado
- **Expediente del alumno** — Pestaña con los documentos firmados/leídos por el tutor
- **WhatsApp para recibos** — Botón que comparte el PDF del recibo de membresía vía WhatsApp (share nativo o `wa.me`)
- **Edición por rol** — El maestro solo puede cambiar la foto del alumno; el admin edita todo
- **Login flexible** — Username y password con `trim()` y comparación sin distinguir mayúsculas
- **OTA Auto-Update** — El backend sirve la versión de la app; el frontend (Capacitor + `@capgo/capacitor-updater`) se actualiza por aire
- **Electron** — App de escritorio para Windows
- **Android vía Capacitor** — Despliegue a dispositivos móviles

## Comandos principales

```bash
# Servidor de desarrollo (web)
npm start

# Servidor de desarrollo con Electron
npm run electron:dev

# Build de producción (web con SSR)
npm run build

# Build para Capacitor (Android)
npm run capacitor:build

# Instalador de Electron (Windows)
npm run electron:build

# Tests unitarios
npm test
```

## Enlaces

- **API backend**: `https://gymcontrol-api-sne4.onrender.com/api/v1/`
- **Entorno local**: descomentar `http://localhost:5000/api/v1/` en `src/environments/environment.development.ts`

## Licencia

Uso interno — Katiras Gymnastics
