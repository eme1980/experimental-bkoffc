# Documentación Técnica — Experimental Backoffice (`experimental-bkoffc`)

> Referencia rápida y completa para retomar el desarrollo sin pérdida de contexto.
> Toda la información de este documento está extraída **estrictamente** del código fuente actual de la rama `main`.
> No se describen tecnologías ni endpoints que no estén implementados en el repo.

---

## 1. Visión General y Arquitectura

### Propósito principal

Backend/backoffice mínimo que expone una API de **autenticación de usuarios** (registro y login) construida con TDD bajo **Clean Architecture**. Es un proyecto "experimental" cuyo objetivo es validar la integración de un backend Node/Express con el BaaS **InsForge** como gestor externo de autenticidad, usuarios y email.

Casos de uso que resuelve hoy:
- **Registro** de un nuevo usuario.
- **Login** de un usuario existente.
- **Recuperación de contraseña** (solicitud de email + cambio de contraseña), **delegada al flujo nativo de InsForge Auth** (`auth.sendResetPasswordEmail` + `auth.resetPassword`).

### Stack tecnológico

- **Lenguaje:** TypeScript (~5.0), compilado a ESM.
- **Framework HTTP:** Express `^5.2.1` (`@types/express ^5.0.6`).
- **Runtime:** Node.js 18 (fijado en el `Dockerfile`). Dev apunta a `@types/node ^20`.
- **BaaS / backend externo:** **InsForge** (`@insforge/sdk ^1.4.2`) — gestiona auth (signUp / signInWithPassword), el flujo de **recuperación de contraseña** nativo y el envío de email.
- **Base de datos:** no hay ORM propio ni acceso directo a tablas de la BaaS desde el código. Todo el estado de usuario y auth se delega en InsForge (módulo auth). No hay migraciones ni seeders en el repo.
- **Build:** `esbuild` `^0.28.2` (bundle ESM).
- **Dev runner:** `ts-node` `^10.9.0`.
- **Tests:** `vitest ^1.0.0` (se ejecuta en real con v1.6.1).

> Nota: el build usa `esbuild` directamente (sin type-checking estricto en el paso de build); el type-check estricto se hace aparte con `npm run typecheck` (`tsc --noEmit`, `tsconfig.json` con `strict: true`).

### Arquitectura

**Clean Architecture en 2 capas concretas** (el "Core" aislado de la "Infraestructura"):

```
┌─────────────────────────────────────────────────┐
│  INFRASTRUCTURE (adaptadores, capa externa)    │
│  • Controllers (HTTP)                           │
│  • Repositories / client de InsForge (SDK)      │
└───────────────▲─────────────────────────────────┘
                │ implementa interfaces del Core
┌───────────────┴─────────────────────────────────┐
│  CORE (dominio, sin dependencias externas)      │
│  • Interfaces (AuthRepository, AuthResetRepository) — contratos │
└─────────────────────────────────────────────────┘
```

- La **dependencia apunta hacia dentro**: el Core solo conoce interfaces (`AuthRepository`, `AuthResetRepository`). La infraestructura implementa esas interfaces y se inyecta en runtime.
- **Inyección de dependencias** manual mediante **Composition Root** en `src/index.ts` (sin contenedor DI). Los controllers inyectan directamente las interfaces del repositorio.
- No es MVC ni modelo-cliente convencional: es un pequeño backend de autenticación delegada en un BaaS. **No hay capa de use-cases** (se eliminaron los proxies puros): el Core expone solo las interfaces-contrato que la infraestructura implementa y cablea el Composition Root.

---

## 2. Estructura del Proyecto

```
experimental-bkoffc/
├── src/
│   ├── index.ts                          # Composition Root + rutas Express + arranque
│   ├── core/                             # CAPA CORE (dominio puro, sin imports externos)
│   │   └── use-cases/
│   │       ├── AuthRepository.ts         # Interfaz + tipo AuthResult (login/registro)
│   │       └── AuthResetRepository.ts    # Interfaz de recuperación de contraseña (delegada a InsForge)
│   └── infrastructure/                   # CAPA INFRAESTRUCTURA (adaptadores)
│       ├── controllers/
│       │   ├── AuthController.ts         # Controlador HTTP de auth (login/registro)
│       │   └── PasswordResetController.ts # Controlador HTTP de recuperación
│       ├── insforge/
│       │   └── client.ts                 # Cliente InsForge (config env)
│       ├── logger/
│       │   ├── Logger.ts                 # Logger estructurado JSON
│       │   └── requestLogger.ts          # Middleware de log de peticiones
│       ├── middleware/
│       │   └── rateLimit.ts              # express-rate-limit (login + reset-request)
│       └── repositories/
│           ├── InsForgeAuthRepository.ts       # AuthRepository → InsForge SDK
│           └── InsForgeAuthResetRepository.ts  # AuthResetRepository → flujo nativo InsForge
├── tests/                                # Unit tests (Vitest)
│   ├── core/
│   │   └── use-cases/ (RegisterUser, LoginUser, RequestPasswordReset, ResetPassword)
│   └── infrastructure/ (controllers, repositories, insforge, logger, middleware)
├── dist/index.js                         # Salida del build (compilado)
├── Dockerfile
├── .dockerignore
├── .gitignore
├── tsconfig.json
├── eslint.config.js
├── vitest.config.ts
├── package.json
├── .env.example
└── README.md
```

- **Controladores:** `src/infrastructure/controllers/`
- **Migraciones / seeders:** **no existen** (la BD la gestiona InsForge)
- **Middlewares:** `express.json()` global + rate limiting en `/auth/login` y `/auth/reset-password-request` vía `src/infrastructure/middleware/rateLimit.ts`.
- **Tests:** `tests/` (espejo de `src/`)

---

## 3. Configuración y Puesta en Marcha

### Requisitos previos
- **Node.js 18** (recomendado por el `Dockerfile`; el dev usa `@types/node ^20`).
- **npm**.
- Una cuenta/entorno **InsForge** con un proyecto configurado (auth con `resetPasswordMethod` + envío de email).

### Variables de entorno críticas

Se documenta en `.env.example` (en `.gitignore` está el `.env` local). Variables que el código lee:

| Variable | Dónde se usa | Propósito |
|---|---|---|
| `INSFORGE_URL` | `src/infrastructure/insforge/client.ts` | Base URL del proyecto InsForge. **Obligatoria.** |
| `INSFORGE_KEY` | `src/infrastructure/insforge/client.ts` | Anon/API key de InsForge. **Obligatoria.** |
| `PORT` | `src/index.ts` | Puerto HTTP (por defecto `3000`). |
| `APP_URL` | `PasswordResetController.ts` | URL base del frontend; el enlace de reset usa `${APP_URL}/reset-password` (default `http://localhost:5173`). |

> Se leen directamente de `process.env` en el servidor Node, sin prefijo `VITE_` (se eliminó el prefijo heredado de un frontend Vite).

### Instalación y arranque local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
#    export INSFORGE_URL=https://...   (obligatorio)
#    export INSFORGE_KEY=...           (obligatorio)
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
  -e INSFORGE_URL=https://... \
  -e INSFORGE_KEY=... \
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
| `POST` | `/auth/reset-password-request` | Solicitar email de recuperación (body: `{ email, redirectTo? }`, el `redirectTo` por defecto es `${APP_URL}/reset-password`) | No |
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

### Recuperación de contraseña (delegada a InsForge nativo)
- El flujo **no se reimplementa localmente**: usa `client.auth.sendResetPasswordEmail({ email, redirectTo })` y `client.auth.resetPassword({ newPassword, otp })`.
- **InsForge previene la enumeración de usuarios**: devuelve éxito aunque el email no exista, por lo que este backend responde siempre el mismo mensaje genérico.
- InsForge gestiona la generación/expiración del token/otp y el envío del email (config `resetPasswordMethod`: enlace o código de 6 dígitos).

### Roles y permisos
- **No existe ningún sistema de roles, permisos ni políticas de autorización.** No hay middlewares de auth, ni casuística de "rol" en ninguna entidad/interfaz.

### Rate limiting (`express-rate-limit ^7.5.1`)
Protección contra fuerza bruta y spam de emails, definida en `src/infrastructure/middleware/rateLimit.ts` y aplicada solo a los dos endpoints más sensibles (el resto de rutas NO están limitadas):

| Endpoint | Límite | Ventana |
|---|---|---|
| `POST /auth/login` | **5 intentos** | 15 minutos |
| `POST /auth/reset-password-request` | **3 solicitudes** | 1 hora |

- **Clave:** por IP (`req.ip`), el `keyGenerator` por defecto de la librería.
- **Comportamiento:** el `(límite+1)`-ésimo intento devuelve **`429`** con `{ "error": "<mensaje>" }` e incluye cabeceras estándar `RateLimit-*` (`standardHeaders: 'draft-8'`, `legacyHeaders: false`).
- **`app.set('trust proxy', 1)`** en `src/index.ts`: necesario porque la app corre detrás del proxy inverso de Dokploy. Sin confiar en proxy, express-rate-limit usaría la IP del proxy para todos los clientes (bloqueo colectivo) o lanzaría `ERR_ERL_PERMISSIVE_TRUST_PROXY` al detectar `X-Forwarded-For`.
- **Nota (fuera de alcance):** `POST /auth/register` y `POST /auth/reset-password` **no** tienen rate limit. `register` podría ser candidato a fuerza bruta/creación masiva de cuentas si se quiere endurecer en el futuro.

---

## 6. Testing y Calidad de Código

### Herramienta
- **Vitest `^1.0.0`** (devDependency; ejecutado en real con **v1.6.1**).

### Estado actual de la suite

```
Test Files  8 passed (8)
     Tests  45 passed (45)
```

| Suite | Tests |
|---|---|
| `tests/infrastructure/controllers/AuthController.test.ts` | 6 |
| `tests/infrastructure/controllers/PasswordResetController.test.ts` | 9 |
| `tests/infrastructure/repositories/InsForgeAuthRepository.test.ts` | 9 |
| `tests/infrastructure/repositories/InsForgeAuthResetRepository.test.ts` | 7 |
| `tests/infrastructure/insforge/client.test.ts` | 2 |
| `tests/infrastructure/logger/Logger.test.ts` | 7 |
| `tests/infrastructure/logger/requestLogger.test.ts` | 2 |
| `tests/infrastructure/middleware/rateLimit.test.ts` | 3 |

- Estilo **unit** con mocks manuales (`vi.fn()`) de las interfaces y del cliente InsForge (`vi.mock`).
- **Sin tests de integración** (no hay llamadas reales a InsForge en las pruebas).

### Comandos
```bash
npm test            # ejecuta la suite (vitest run)
npm run test:coverage  # suite + reporte de cobertura (umbrales 90%)
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

### Análisis estático / linters
- **ESLint 9** (flat config `eslint.config.js`, `typescript-eslint`). Comando: `npm run lint`.
- **TypeScript strict type-check**: `npm run typecheck` (`tsc --noEmit`).
- **Cobertura de tests** (Vitest + `@vitest/coverage-v8`): umbrales 90% (statements, branches, functions, lines). Comando: `npm run test:coverage`.
- Los adaptadores externos (SDK de InsForge) y el Composition Root se excluyen de la cobertura por ser wrappers finos que requieren mocking del SDK externo.

---

## 7. Despliegue y Operativa (Ops)

### Empaquetado y despliegue
- **Docker multi-stage** (`Dockerfile`): stage `build` (node:18-alpine + `npm install` + `npm run build`) → stage runtime (solo `dist/`, `node_modules/` y `package*.json`).
- El despliegue en el entorno real se realiza en **Dokploy** (contenedor `bk.contrateme.es`), con deploy automático al hacer **push a `main`**.
- **CI/CD:** **no hay pipeline CI** dentro del repo (no existe `.github/workflows/`). El disparo de deploy lo gestiona Dokploy externamente, no un workflow de GitHub Actions.

### Logs y monitorización
- **Logging estructurado** (`src/infrastructure/logger/`): sin dependencias externas. `Logger` escribe **una línea JSON por evento** — `{ timestamp, level, message, ...meta }` — a `stdout` (debug/info/warn) o `stderr` (error), pensado para la agregación de logs de Dokploy.
  - Niveles: `debug < info < warn < error`. El nivel mínimo se ajusta con `LOG_LEVEL` (defecto `info`).
  - `createRequestLogger` es un middleware que emite un evento `request completed` (`method`, `path`, `status`, `durationMs`) al finalizar cada petición HTTP.
  - Sustituye todos los `console.log`/`console.error` previos (arranque, repositorios InsForge, `client.ts`).

### Mantenimiento / operativa habitual
- Revisar logs del contenedor en Dokploy o con:
  ```bash
  docker logs -f <contenedor>
  ```
- Verificar salud del servicio: `curl https://bk.contrateme.es/` (debe responder `{"name":"Experimental Backoffice API","version":"1.0.0","status":"ok"}`).
- Gestionar usuarios/email desde el panel de InsForge (no hay CLI/scripts en el repo).

---

## 8. Notas y Deuda Técnica Detectada

> Estado actual: el flujo de recuperación de contraseña se **delegó por completo en el flujo nativo de InsForge Auth**, eliminando el flujo custom que consultaba la tabla `users`.

1. ✅ **Recuperación de contraseña delegada a InsForge** (resuelto): se eliminó el flujo custom (`RequestPasswordReset`/`ResetPassword` con persistencia en tabla `users`, hashing de token, `InsForgeUserRepository`, `InsForgeEmailService`, `hashToken`, `ResetUser`). Ahora se usa `client.auth.sendResetPasswordEmail({ email, redirectTo })` y `client.auth.resetPassword({ newPassword, otp })`. **Esto arregla el bug de producción** (el `500 "Could not fetch user from database"` al consultar una tabla `users` no poblada).
2. ✅ **Anti-enumeración de usuarios**: con el flujo nativo, InsForge devuelve éxito aunque el email no exista; el backend responde siempre el mismo mensaje genérico (antes revelaba existencia con `404 User not found`/`500`).
3. ✅ **Eliminación de código duplicado/deuda**: se borraron la entidad `User`, `ResetUser`, `UserRepository`, `EmailService`, `hashToken` y los adaptadores de tabla `users`/email custom. Neto: menos superficie de bug y menos contrato ante el SDK.
4. ✅ **`tsconfig.json` añadido** (modo `strict`, `moduleResolution: bundler`); el typecheck pasa limpio.
5. ✅ **Herramientas de calidad**: ESLint 9 (flat config, `typescript-eslint`), cobertura de tests (Vitest v8, umbrales 90%, core al 100%) y scripts `lint`, `typecheck` y `test:coverage`. `.env.example` y `README.md` del repo.

### API real de InsForge (SDK `@insforge/sdk` 1.4.2) — referencia verificada
- **Auth:** `client.auth.signUp({ email, password })`, `client.auth.signInWithPassword({ email, password })`.
- **Recuperación de contraseña (nativo):** `client.auth.sendResetPasswordEmail({ email, redirectTo? })` (previene enumeración) y `client.auth.resetPassword({ newPassword, otp })`. El `otp` es el token del enlace o el código de 6 dígitos según `resetPasswordMethod`.
- **Email (auth):** la entrega de emails de verificación/reset la gestiona InsForge Auth (no se usa `client.emails.send` en este backend).

#### Observabilidad (logging estructurado)
7. ✅ **Logging estructurado añadido**: se creó `src/infrastructure/logger/` (`Logger` + `createRequestLogger`) sustituyendo todos los `console.log`/`console.error`. Nivel configurable vía `LOG_LEVEL`. **⏳ Pendiente** (si el proyecto crece): agregación central de logs y correlación de trazas por `requestId`.
8. ✅ **Simplificación del auth core (T2)**: se eliminaron los use-cases proxy puros (`LoginUser`, `RegisterUser`, `RequestPasswordReset`, `ResetPassword`) que no aportaban lógica. Los controllers dependen directamente de las interfaces del core (`AuthRepository`, `AuthResetRepository`). El Core queda como capa de contratos; la infraestructura implementa e inyecta. Suite: 45 tests / 8 archivos.
