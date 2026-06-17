# GymControl

Aplicación híbrida para gestión de gimnasios: control de alumnos, maestros, usuarios, asistencias y membresías.

## Stack

- **Angular 20** + **Ionic 8** — UI responsive y componentes nativos
- **Capacitor** — despliegue a Android
- **Electron** — aplicación de escritorio para Windows
- **SSR** (Angular Universal) — renderizado del lado del servidor
- **Karma + Jasmine** — tests unitarios

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
