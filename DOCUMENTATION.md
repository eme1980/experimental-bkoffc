# Documentación Técnica — Experimental Backoffice (`experimental-bkoffc`)

> Referencia rápida y completa para retomar el desarrollo sin pérdida de contexto.
> Toda la información de este documento está extraída **estrictamente** del código fuente actual de la rama `main` (commit `2615e26`).
> No se describen tecnologías ni endpoints que no estén implementados en el repo.

---

## 1. Visión General y Arquitectura

### Propósito principal

Backend/backoffice mínimo que expone una API de **autenticación de usuarios** (registro y login) construida con TDD bajo **Clean Architecture**. Es un proyecto "experimental" cuyo objetivo es validar la integración de un backend Node/Express con el BaaS **InsForge** como gestor externo de autenticidad, usuarios y email.

Casos de uso que resuelve hoy:
- **Registro** de un nuevo usuario.
- **Login** de un usuario existente.
- *(Diseñado pero NO expuesto vía API)* flujo de **recuperación de contraseña** (solicitud + reset).

> ⚠️ **Hallazgo clave al documentar:** el flujo de recuperación de contraseña (`RequestPasswordReset`, `ResetPassword`, `InsForgeEmailService`, `InsForgeUserRepository`) **existe en el código fuente y está cubierto por tests, pero NO está cableado en el Composition Root** (`src/index.ts`). No hay rutas HTTP para él. Consultar §7.

### Stack tecnológico

- **Lenguaje:** TypeScript (~5.0), compilado a ESM.
- **Framework HTTP:** Express `^5.2.1` (`@types/express ^5.0.6`).
- **Runtime:** Node.js 18 (fijado en el `Dockerfile`). Dev apunta a `@types/node ^20`.
- **BaaS / backend externo:** **InsForge** (`@insforge/sdk ^1.4.2`) — gestiona auth (signUp / signInWithPassword), persistencia (tabla `users`) y envío de email.
- **Base de datos:** no hay ORM propio; la persistencia se delega en InsForge (`client.db.insert` / `client.db.select`). No hay migraciones ni seeders en el repo.
- **Build:** `esbuild` `^0.28.2` (bundle ESM).
- **Dev runner:** `ts-node` `^10.9.0`.
- **Tests:** `vitest ^1.0.0` (se ejecuta en real con v1.6.1).

> Nota: **no existe `tsconfig.json`**. El build usa `esbuild` directamente (sin type-checking estricto en el paso de build). El tipo de caja es xy residual de Vite (`import.meta.env`) en el `InsForgeEmailService` (ver §7).

### Arquitectura

**Clean Architecture en 2 capas concretas** (el "Core" aislado de la "Infraestructura"):

```
┌─────────────────────────────────────────────────┐
│  INFRAESTRUCTURE (adaptadores, capa externa)    │
│  • Controllers (HTTP)                           │
│  • Repositories / client de InsForge (SDK)      │
│  • EmailService (InsForge email)                │
└───────────────▲─────────────────────────────────┘
                │ implementa interfaces del Core
┌───────────────┴─────────────────────────────────┐
│  CORE (dominio, sin dependencias externas)      │
│  • Entidades (User)                             │
│  • Use-Cases (RegisterUser, LoginUser, ...)     │
│  • Interfaces (AuthRepository, UserRepository,  │
│     EmailService) — contratos                  │
└─────────────────────────────────────────────────┘
```

- La **dependencia apunta hacia dentro**: el Core solo conoce interfaces (`AuthRepository`, `UserRepository`, `EmailService`). La infraestructura implementa esas interfaces y se inyecta en runtime.
- **Inyección de dependencias** manual mediante **Composition Root** en `src/index.ts` (sin contenedor DI).
- No es MVC ni modelo-cliente convencional: es un pequeño backend de autenticación delegada en un BaaS.

---

## 2. Estructura del Proyecto

```
experimental-bkoffc/
├── src/
│   ├── index.ts                          # Composition Root + rutas Express + arranque
│   ├── core/                             # CAPA CORE (dominio puro, sin imports externos)
│   │   ├── entities/
│   │   │   └── User.ts                   # Entidad con validación de email y password
│   │   └── use-cases/
│   │       ├── AuthRepository.ts         # Interfaz + tipo AuthResult
│   │       ├── LoginUser.ts              # Use-case login
│   │       ├── RegisterUser.ts           # Use-case registro
│   │       ├── RequestPasswordReset.ts   # Use-case solicitar reset (sin cablear)
│   │       ├── ResetPassword.ts          # Use-case reset (sin cablear)
│   │       ├── UserRepository.ts         # Interfaz de persistencia
│   │       └── EmailService.ts           # Interfaz de email
│   └── infrastructure/                   # CAPA INFRAESTRUCTURA (adaptadores)
│       ├── controllers/
│       │   └── AuthController.ts         # Controlador HTTP de auth
│       ├── insforge/
│       │   ├── client.ts                 # Cliente InsForge (config env)
│       │   └── InsForgeEmailService.ts   # Adaptador email (sin cablear)
│       └── repositories/
│           ├── InsForgeAuthRepository.ts # AuthRepository → InsForge SDK
│           └── InsForgeUserRepository.ts # UserRepository → InsForge db (sin cablear)
├── tests/                                # Unit tests (Vitest)
│   ├── core/
│   │   ├── entities/User.test.ts
│   │   └── use-cases/ (RegisterUser, LoginUser, RequestPasswordReset, ResetPassword)
│   └── infrastructure/controllers/AuthController.test.ts
├── dist/index.js                         # Salida del build (compilado)
├── Dockerfile
├── .dockerignore
├── .gitignore
├── package.json
└── README.md                             # Solo título, sin contenido
```

- **Controladores:** `src/infrastructure/controllers/`
- **Modelos / entidades:** `src/core/entities/`
- **Migraciones / seeders:** **no existen** (la BD la gestiona InsForge)
- **Middlewares:** ninguno propio (solo `express.json()` global)
- **Tests:** `tests/` (espejo de `src/`)

---

## 3. Configuración y Puesta en Marcha

### Requisitos previos
- **Node.js 18** (recomendado por el `Dockerfile`; el dev usa `@types/node ^20`).
- **npm**.
- Una cuenta/entorno **InsForge** con un proyecto configurado (auth + tabla `users` + email).

### Variables de entorno críticas

> ⚠️ **No existe `.env.example` en el repo** (solo está `.env` en `.gitignore`). Estas son las variables que el código lee realmente:

| Variable | Dónde se usa | Propósito |
|---|---|---|
| `VITE_INSFORGE_URL` | `src/infrastructure/insforge/client.ts` | Base URL del proyecto InsForge. **Obligatoria.** |
| `VITE_INSFORGE_KEY` | `src/infrastructure/insforge/client.ts` | Anon/API key de InsForge. **Obligatoria.** |
| `PORT` | `src/index.ts` | Puerto HTTP (por defecto `3000`). |
| `VITE_APP_URL` | `InsForgeEmailService.ts` (sin cablear) | URL base del frontend para el enlace de reset (default `http://localhost:5173`). |

> Los prefijos `VITE_` son heredados de un frontend Vite y pueden confundir; el servidor los lee directamente de `process.env`.

### Instalación y arranque local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
#    export VITE_INSFORGE_URL=https://...   (obligatorio)
#    export VITE_INSFORGE_KEY=...           (obligatorio)
#    export PORT=3000                       (opcional)

# 3. Modo desarrollo (watch, ts-node/esm)
npm run dev

# 4. Build + arranque en producción
npm run build
npm start
```

### Docker

```bash
docker build -t experimental-bkoffc .
docker run -p 3000:3000 \
  -e VITE_INSFORGE_URL=https://... \
  -e VITE_INSFORGE_KEY=... \
  experimental-bkoffc
```

- El `Dockerfile` es **multi-stage** (build con node:18-alpine → runtime).
- Expone el puerto **3000**.
- **No hay `docker-compose.yml`**: NO hay migraciones, seeders ni base de datos local que levantar (todo delegado a InsForge).

---

## 4. API y Endpoints Principales

Rutas registradas en `src/index.ts`. **Ninguna requiere autenticación** (el propio backend solo gestiona login/registro; no hay middlewares de auth ni roles).

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/` | Health-check / metadata del API | No |
| `POST` | `/auth/register` | Registrar nuevo usuario | No |
| `POST` | `/auth/login` | Iniciar sesión | No |
| `POST` | `/auth/reset-password-request` | Solicitar email de recuperación de contraseña (body: `{ email }`) | No |
| `POST` | `/auth/reset-password` | Confirmar cambio de contraseña (body: `{ token, password }`) | No |

### Formato de respuestas

**Éxito `POST /auth/register` → `201`**
```json
{
  "token": "session-token-o-null",
  "user": { "id": "user-1", "email": "test@example.com" }
}
```

**Éxito `POST /auth/login` → `200`**
```json
{
  "token": "session-token-o-null",
  "user": { "id": "user-1", "email": "test@example.com" }
}
```

**Éxito `GET /` → `200`**
```json
{ "name": "Experimental Backoffice API", "version": "1.0.0", "status": "ok" }
```

**Manejo de errores** — siempre `{ "error": "<mensaje>" }`:
- Faltan `email`/`password` (tanto login como register) → **`400`** `"Email and password are required"`.
- `register` falla (p. ej. email duplicado) → **`400`** `error.message`.
- `login` falla (credenciales inválidas) → **`401`** `error.message`.

El `token` puede ser `null` si el SDK no devuelve `accessToken` (depende del flujo/confirmación de email en InsForge).

---

## 5. Seguridad y Autenticación

### Mecanismo
- **No hay JWT/sessions propias implementadas en el código.**
- La autenticación se **delega completamente en InsForge** (BaaS):
  - `client.auth.signUp({ email, password })`
  - `client.auth.signInWithPassword({ email, password })`
- El `accessToken` devuelto por el SDK se propaga como `token` en las respuestas. Es un token **emitido y validado por InsForge**, no por esta app.

### Validaciones propias (entidad `User` en `src/core/entities/User.ts`)
- **Email:** valida formato con regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` → error `"Invalid email format"`.
- **Password:** longitud mínima **8 caracteres** → error `"Password too short"`.
- La validación de email/password solo se dispara si el use-case usa la entidad `User`; los use-cases `LoginUser`/`RegisterUser` actuales pasan `email`/`password` **directamente** al repositorio sin instanciar `User` (la entidad no está cableada en el flujo real).

### Roles y permisos
- **No existe ningún sistema de roles, permisos ni políticas de autorización.** No hay middlewares de auth, ni casuística de "rol" en ninguna entidad/interfaz.

---

## 6. Testing y Calidad de Código

### Herramienta
- **Vitest `^1.0.0`** (devDependency; ejecutado en real con **v1.6.1**).

### Estado actual de la suite

```
Test Files  6 passed (6)
     Tests  18 passed (18)
```

| Suite | Tests |
|---|---|
| `tests/core/entities/User.test.ts` | 3 |
| `tests/core/use-cases/RegisterUser.test.ts` | 2 |
| `tests/core/use-cases/LoginUser.test.ts` | 2 |
| `tests/core/use-cases/RequestPasswordReset.test.ts` | 2 |
| `tests/core/use-cases/ResetPassword.test.ts` | 3 |
| `tests/infrastructure/controllers/AuthController.test.ts` | 6 |

- Estilo **unit** con mocks manuales (`vi.fn()`) de las interfaces.
- **Sin tests de integración** (no hay llamadas reales a InsForge en las pruebas).

### Comandos
```bash
npm test          # ejecuta la suite (vitest run)
# sin modo watch configurado en package.json
```

### Análisis estático / linters
- **No hay linter** (no ESLint/Biome en `package.json`/config).
- **No hay coverage configurado** (`coverage/` solo está ignorado en `.gitignore`; no hay `--coverage` ni umbrales).
- **No existe `tsconfig.json`**, por lo que el build NO realiza type-checking estricto (solo `esbuild`).

---

## 7. Despliegue y Operativa (Ops)

### Empaquetado y despliegue
- **Docker multi-stage** (`Dockerfile`): stage `build` (node:18-alpine + `npm install` + `npm run build`) → stage runtime (solo `dist/`, `node_modules/` y `package*.json`).
- El despliegue en el entorno real se realiza en **Dokploy** (contenedor `bk.contrateme.es`), con deploy automático al hacer **push a `main`**.
- **CI/CD:** **no hay pipeline CI** dentro del repo (no existe `.github/workflows/`). El disparo de deploy lo gestiona Dokploy externamente, no un workflow de GitHub Actions.

### Logs y monitorización
- **No hay sistema de logging estructurado** (sin winston/pino). Solo `console.log` / `console.error`:
  - Arranque: `🚀 Server running on http://localhost:<PORT>` + lista de endpoints.
  - `InsForgeUserRepository`: `Error saving user to InsForge` / `Error finding user in InsForge`.
  - `InsForgeEmailService`: `Reset email sent successfully` / `Error sending reset email via InsForge`.
  - `client.ts`: `Missing InsForge configuration...` si faltan `VITE_INSFORGE_URL`/`VITE_INSFORGE_KEY`.

### Mantenimiento / operativa habitual
- Revisar logs del contenedor en Dokploy o con:
  ```bash
  docker logs -f <contenedor>
  ```
- Verificar salud del servicio: `curl https://bk.contrateme.es/` (debe responder `{"name":"Experimental Backoffice API","version":"1.0.0","status":"ok"}`).
- Gestionar usuarios/email desde el panel de InsForge (no hay CLI/scripts en el repo).

---

## 8. Notas y Deuda Técnica Detectada

> Estado actual (rama `feature/password-reset-flow`): los puntos 1–3 y 5 se han **resuelto** durante la sesión de cableado. Quedan pendientes 4 y 6 como mejoras de calidad.

1. ✅ **Recuperación de contraseña cableada** (resuelto): `RequestPasswordReset`, `ResetPassword`, `InsForgeUserRepository` e `InsForgeEmailService` ahora se inyectan en `src/index.ts` y se exponen vía `POST /auth/reset-password-request` y `POST /auth/reset-password`.
2. ✅ **Bug Vite corregido**: `InsForgeEmailService` usa ahora `process.env.VITE_APP_URL` y la API real `client.emails.send({ to, subject, html })` (el campo es `html`, no `text`).
3. ✅ **Token criptográficamente seguro**: `RequestPasswordReset` usa `crypto.randomBytes(32)` (antes `Math.random()`) y el import incorrecto `{ crypto }` se corrigió a `{ randomBytes }`.
4. ⏳ **Tipado débil**: `UserRepository` usa `any` / objeto plano `ResetUser`. Se podría tipar con una interfaz dedicada.
5. ✅ **`tsconfig.json` añadido** (modo `strict`, `moduleResolution: bundler`); el typecheck ahora pasa limpio.
6. ⏳ **Mejoras de calidad pendientes**: añadir ESLint y configurar cobertura de tests (`coverage/` sigue siendo solo un ignore). Se creó `.env.example` durante el cableado.

### API real de InsForge (SDK `@insforge/sdk` 1.4.2) — referencia verificada
- **Auth:** `client.auth.signUp({ email, password })`, `client.auth.signInWithPassword({ email, password })`.
- **BD:** `client.database.from('users').select().eq(col, val).maybeSingle()` para consultas; `client.database.from('users').insert(payload).select()` para escrituras. **NO** existe `client.db`.
- **Email:** `client.emails.send({ to, subject, html })`. **NO** existe `client.email`. El campo de contenido es `html` (obligatorio), no `text`.
