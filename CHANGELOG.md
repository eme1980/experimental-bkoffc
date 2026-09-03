# Changelog

Todas las notas de cambio notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

### Añadido

- **Middleware CORS** (`src/infrastructure/middleware/cors.ts`, dependencia `cors ^2.8.6`): permite que el API sea consumido por webs/apps de distinto origen. Lista de orígenes permitidos configurable vía `CORS_ORIGINS` (separados por comas); origen autorizado → `Access-Control-Allow-Origin` + credenciales; `CORS_ORIGINS` vacío → se deniega todo origen cross-origin (no se usa `*`). Aplicado globalmente en `src/index.ts`.
- **`ARCHITECTURE.md`** — documento de diseño y visión que define el rumbo a medio plazo: convertir el backend en un servicio de gestión de usuarios compartido entre varias webs/apps. Acota el alcance (auth centralizado + perfil básico + memberships), difiere SSO y roles multi-app a cuando exista una segunda app real, e incluye hoja de ruta (CORS → client credentials → usuarios+memberships → sesión portable) y riesgos. **Actualizado:** se documenta que InsForge ya ofrece "OAuth Server mode" (proveedor OAuth 2.0/OIDC con client_id/secret por app y scopes) para la identificación de clientes, por lo que T-02 queda **diferido** (revisar el BaaS antes de construir client-credentials propios); T-03 se apoya en el módulo `database` + RLS de InsForge.

### Cambiado

- **Renombrado de variables de entorno:** incluye además **`CORS_ORIGINS`** (nueva, opcional): lista de orígenes CORS permitidos. Ver la entrada de CORS en *Añadido*.

## [1.0.0] - 2026-09-03

Versión inicial del backend experimental de autenticación (`experimental-bkoffc`),
desplegado como `bk.contrateme.es`. Backend Node 18 / Express 5 / TypeScript bajo
Clean Architecture y TDD, con **autenticación, recuperación de contraseña y email
delegados al BaaS InsForge** (`@insforge/sdk`).

### Añadido

- **Proyecto y base:**
  - Backend Express 5 con TypeScript (ESM, `esbuild` para build).
  - Autenticación de usuarios delegada a InsForge: `POST /auth/register` y `POST /auth/login` (`auth.signUp` / `auth.signInWithPassword`).
  - Health-check `GET /` con metadatos del API.
  - `Dockerfile` multi-stage para despliegue en Dokploy.
- **Recuperación de contraseña** (`POST /auth/reset-password-request` y `POST /auth/reset-password`), implementada inicialmente con flujo propio y **posteriormente delegada al flujo nativo de InsForge Auth** (ver *Cambiado* y `auth.sendResetPasswordEmail` / `auth.resetPassword`).
- **Logging estructurado** (`src/infrastructure/logger/`): `Logger` JSON + middleware `createRequestLogger` en cada petición; nivel configurable vía `LOG_LEVEL`.
- **Rate limiting** (`express-rate-limit`) anti-fuerza-bruta en `POST /auth/login` (5 intentos / 15 min) y `POST /auth/reset-password-request` (3 solicitudes / 1 h), con `trust proxy` para Dokploy.
- **Cobertura de tests** con Vitest v8 y umbrales ≥90% (core al 100%), más `vitest.config.ts`.
- **Calidad de código:** ESLint 9 (flat config, `typescript-eslint`), `tsconfig.json` (modo `strict`) y scripts `lint`, `typecheck` y `test:coverage`.
- Documentación de soporte: `README.md` y `DOCUMENTATION.md` (guía para retomar el desarrollo).

### Cambiado

- **`1.0.0`** → Cobertura de tests de los adaptadores InsForge (mocks del SDK).
- **Recuperación de contraseña delegada al flujo nativo de InsForge Auth**:
  - El flujo custom (persistencia en tabla `users`, hash de token, `InsForgeUserRepository`, `InsForgeEmailService`, `hashToken`) fue **reemplazado** por `client.auth.sendResetPasswordEmail({ email, redirectTo })` y `client.auth.resetPassword({ newPassword, otp })`.
  - El backend responde siempre un mensaje genérico ("If the email exists, a recovery link was sent"), evitando la **enumeración de usuarios**.
- **Simplificación del núcleo (`refactor`)**: se eliminó la capa de use-cases proxy puros (`LoginUser`, `RegisterUser`, `RequestPasswordReset`, `ResetPassword`). Los controllers (`AuthController`, `PasswordResetController`) dependen directamente de las interfaces del `core` (`AuthRepository`, `AuthResetRepository`). El Controller maneja la derivación de `redirectTo` desde `VITE_APP_URL`.
- **Logging**: sustituidos todos los `console.log`/`console.error` por el logger estructurado.

### Eliminado

- Flujo de reset custom y sus piezas: `InsForgeUserRepository`, `UserRepository`, `EmailService`, `InsForgeEmailService`, `hashToken`, entidad `User` (con su tipo `ResetUser`) y `src/core/security/`.
- Capa de use-cases proxy: `LoginUser`, `RegisterUser`, `RequestPasswordReset`, `ResetPassword`.

### Corregido

- **Bug crítico de merge (build roto):** `src/index.ts` duplicaba `const app = express()` (dos `app` en el mismo scope) al combinar los merges de rate-limiting y logging → `TS2451`/`SyntaxError`, el servidor no arrancaba. Consolidado en un único arranque.
- **Bug `save()` con insert en lugar de update:** al persistir datos de usuario existente se usaba `.insert()` creando filas duplicadas; corregido a `.update(payload).eq('id', id)` cuando el usuario ya existe.
- **Bug de token inseguro:** `RequestPasswordReset` usaba `Math.random()`; corregido a `crypto.randomBytes(32)`.
- **Bug de tipo de caja residual de Vite:** `import.meta.env` en el servidor Express reemplazado por `process.env`.
- **Bug SDK:** uso de APIs inexistentes (`client.db` / `client.email`) corregido a la API real (`client.database.*` / `client.emails.send`).
- **Tipado débil:** `UserRepository` ahora usa el tipo de dominio correcto en lugar de `any`.

### Seguridad

- Recuperación de contraseña delegada a InsForge Auth nativo: gestiona expiración del token/OTP y **previene la enumeración de usuarios** (no revela si un email existe).
- `express-rate-limit` en login y reset-request como protección anti-fuerza-bruta.
- Sin secretos en el repositorio: credenciales solo en `.env`/`.env.example`/panel, nunca en código.

[No publicado]: https://github.com/eme1980/experimental-bkoffc
[1.0.0]: https://github.com/eme1980/experimental-bkoffc/releases/tag/1.0.0