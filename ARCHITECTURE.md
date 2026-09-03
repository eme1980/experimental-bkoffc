# Arquitectura — Experimental Backoffice (`experimental-bkoffc`)

> Documento de **diseño y visión** del proyecto. Complementa a `DOCUMENTATION.md` (que describe el **estado actual** del código).
> Este documento describe **hacia dónde va** el proyecto y las decisiones tomadas, no necesariamente lo ya implementado.
> Todo lo marcado como ⏳ (pendiente/roadmap) es una intención, **no** una realidad de `main` — no asumir que está implementado hasta que lo diga el código.

---

## 1. Objetivo y visión

El objetivo a medio plazo es convertir este backend en un **servicio de gestión de usuarios compartido** (un pequeño SaaS *self-hosted* para los proyectos de un único desarrollador) que cualquier **web o app** pueda consumir por API para:

- **Registrar** usuarios.
- **Iniciar sesión** (login).
- **Recuperar contraseña**.
- Tener una **identidad/lista de usuarios** unificada entre las distintas apps de Miguel.

La idea central es evitar **reconstruir la gestión de usuarios en cada app nueva**: construirla **una vez**, de forma robusta, y reutilizarla. El proveedor de identidad/fondo de auth es **InsForge (BaaS)**, que ya gestiona el auth, el email de verificación, el flujo de reset y la base de datos subyacente (PostgreSQL 16).

**Filosofía del alcance:** "empezar pequeño y crecer solo cuando haya una segunda app real". No construir SSO/roles multi-tenant hasta que exista una segunda aplicación que lo exija.

---

## 2. Decisiones de arquitectura

Estas son las decisiones **acordadas**, con su racional. Salvo que Miguel rebata alguna, se aplicarán en el orden indicado.

### D1. Separar *autenticación* de *perfil*
- **Autenticación** (¿quién puede entrar?) → delegada a InsForge Auth (signUp / signInWithPassword / reset).
- **Perfil / datos de usuario** (¿qué sé de cada persona?) → entidad propia si es necesaria.
- Esta separación evita acoplar la operación central a los datos específicos de cada app.

### D2. Servicio de *auth centralizado* (SÍ, en v1)
- Login/register/reset vía API, consumido por N apps. Es el patrón estándar (Auth0/Clerk/Supabase Auth) y **el 60% ya está construido** (controllers + repos InsForge).
- Es barato, reusable y encaja con la Clean Architecture actual.

### D3. *Tabla de usuarios unificada* = usuarios + membresías (SÍ, acotado)
- NO una única mesa `users` gigante con todos los campos de todas las apps.
- Modelo: **usuarios** (identidad ancla, `email` único) + **relación many-to-many con las apps** vía `memberships`.
- Así cada app declara el *nivel de acceso* que tiene sobre un usuario, sin mezclar datos.

### D4. SSO completo y roles multi-app (NO en v1 — posponer)
- Sesión central portable entre dominios (JWT/refresh validado contra el servicio) y roles/permisos por app.
- Diferido **hasta que exista una segunda app real** que lo exija. Hasta entonces cada app gestiona su sesión contra este servicio como prefiera.

### D5. Perfil compartido (SÍ, pero mínimo)
- Un **perfil básico por usuario** (identidad + campos comunes) SI es necesario.
- Los datos específicos de cada app viven **en la app**, no en el servicio central. Extender el servicio solo cuando haya evidencia de que algo se comparte de verdad.

### D6. `APP_URL` NO es variable global del servicio
- Con varias apps consumiendo el servicio, cada frontend tiene su propia URL de reset.
- El endpoint `POST /auth/reset-password-request` ya acepta `redirectTo` por request; cada app pasa el suyo. No definir `APP_URL` como global (fallback `localhost:5173` solo para dev local).

---

## 3. Estado actual (fiel a `main`, ya implementado)

Ver `DOCUMENTATION.md` para el detalle completo. Resumen de lo que **ya existe**:

- Backend Express 5 + TypeScript (Node 18), Clean Architecture 2 capas (Core de contratos + Infraestructura).
- **Auth delegada a InsForge**: `client.auth.signUp`, `client.auth.signInWithPassword`.
- **Reset delegado al nativo de InsForge**: `client.auth.sendResetPasswordEmail({ email, redirectTo })`, `client.auth.resetPassword({ newPassword, otp })`. (Anti-enumeración: mismo mensaje genérico siempre.)
- Endpoints públicos (sin auth): `GET /`, `POST /auth/register`, `POST /auth/login`, `POST /auth/reset-password-request`, `POST /auth/reset-password`.
- **Rate limiting** en endpoints sensibles: login 5/15min, reset-request 3/h. `trust proxy` para Dokploy.
- **Logging estructurado** JSON (`src/infrastructure/logger/`), nivel por `LOG_LEVEL`.
- **TDD** (45 tests / 8 archivos), cobertura umbral 90%, ESLint 9, `tsc --noEmit` strict.
- Despliegue en Dokploy (`bk.contrateme.es`), deploy al push a `main`.

---

## 4. Modelo multi-app objetivo (roadmap)

Cómo encajará el **servicio** con las distintas apps que lo consuman:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Web A      │  │  Web B      │  │  App móvil  │
│ (frontend)  │  │ (frontend)  │  │  (client)   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │  POST /auth/login, /register,...│
       └───────────────┬───────────────┘
              ┌────────▼────────┐
              │  ESTE SERVICIO  │  experimental-bkoffc
              │  (auth unificado│
              │   + usuarios)   │
              └────────┬────────┘
                   InsForge (BaaS)
              ┌────────▼────────┐
              │  auth + email + │
              │  PostgreSQL 16  │
              └─────────────────┘
```

- Cada app se identifica ante el servicio. **InsForge ya ofrece un "OAuth Server mode"** (proveedor OAuth 2.0/OIDC: client_id + client_secret por app y scopes) para este caso — antes de construir identificación propia, revisar si basta (ver T-02).
- La lista de usuarios es **única**: un email = una identidad; las apps se relacionan con ella vía membresías.

---

## 5. Hoja de ruta (orden de ataque)

Orden propuesto para ir evolucionando el servicio, **en serie (una rama + un PR a la vez)**, con TDD.

### T-01 — CORS configurable ✅ (implementado)
- **Qué:** permitir consumo desde varios dominios/apps.
- **Cómo:** se implementó con `cors` en `src/infrastructure/middleware/cors.ts`, configurable por env `CORS_ORIGINS` (lista separada por comas). Origen en lista → `Access-Control-Allow-Origin` reflejado + credenciales; `CORS_ORIGINS` vacío → se deniega todo origen cross-origin (no se usa `*`).
- **Estado:** hecho (ver `DOCUMENTATION.md` §5).

### T-02 — Identificación de clientes (client credentials / API keys por app) ⏳ ✋ revisar antes
- **Qué:** distinguir qué app llama al servicio (client_id + secret) para rate-limit y permisos por-app, no solo por IP.
- **⚠️ Hallazgo:** **InsForge ya tiene "OAuth Server mode"** (`docs.insforge.dev/oauth-server`): actúa como proveedor OAuth 2.0/OIDC, emite **client_id + client_secret por app**, scopes (`user:read`, etc.), flujo Authorization Code + PKCE y endpoint de perfil. **Antes de construir identificación propia, agotar esto** — montar client-credentials a mano duplicaría el BaaS (v. directriz "aprovecha InsForge", §7).
- **Estado:** **diferido** hasta que exista una segunda app real. Cuando haya una, primero evaluar si el OAuth Server de InsForge cubre la identificación; solo si no, construir capa propia.

### T-03 — Modelo de datos usuarios + memberships
- **Qué:** entidades `User` (identidad) y `Membership` (userId + appId + nivel de acceso/rol).
- **Cómo:** sobre el módulo `database` del SDK de InsForge (`client.database.from(...)`), reutilizando su PostgreSQL/PostgREST (no una capa SQL propia). Con RLS (row-level security) de InsForge leyendo el JWT, la autorización por-app puede salir del BaaS.
- **Nota:** aquí hay que decidir el **ancla de identidad** (email único, u otro) antes de codificar.

### T-04 — Sesión portable (JWT/refresh validado por este servicio)
- **Qué:** que el `accessToken` de InsForge se pueda validar desde cualquier app, no solo desde la que emitió el login.
- **Cuándo:** solo si una segunda app real lo necesita (D4). Si no, diferido.

### T-05 — Roles/permisos por app
- **Qué:** autorización granular (app A puede leer perfil, app B puede escribirlo).
- **Cuándo:** después de T-03, y solo cuando haya un caso real.

### T-06 — Endurecer `register` con rate limit
- **Qué:** añadir rate limiting a `POST /auth/register` (creación masiva de cuentas).
- **Nota:** ya detectado como deuda en `DOCUMENTATION.md` §5.

---

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Punto único de fallo**: si el servicio se cae, se caen todas las apps que lo usan. | No centralizar más de lo necesario en v1. El servicio debe ser simple y estable antes de crecer. |
| **Construir de más** (over-engineering / "matar moscas a cañonazos"). | D4/D5: no construir SSO ni roles completos hasta que exista una segunda app real. |
| **Modelo de datos incorrecto** al unificar usuarios (mezclar perfiles de apps distintas). | D3/D5: usuarios + memberships; datos de app en la app, no en el servicio. |
| **Mezclar identidades** (dos apps con el mismo email = ¿misma persona?). | Decidir el ancla de identidad (email) explícitamente en T-03 antes de codificar. |
| **`APP_URL` confusa** en multi-app. | D6: no usar variable global; cada app pasa `redirectTo`. |
| **CORS / credenciales inseguras.** | T-01 y T-02 primero; origen no `*` en endpoints con credenciales. |

---

## 7. Reglas de oro (no negociables)

Aplican a todo trabajo futuro sobre este proyecto (ver también `DOCUMENTATION.md` y el convenio de trabajo):
1. **Nunca** tocar/pushear `main` directamente — ramas `feature/*`/`bugfix/*` + PR aprobado.
2. **TDD estricto**: commit en cada fase RED → GREEN → REFACTOR.
3. **Clean Architecture**: Core aislado de Infraestructura (solo interfaces).
4. **Fidelidad al diseño**: sin rediseños no solicitados. Código limpio, mín. dependencias.
5. **Secrets solo** en `.env`/panel, nunca en chat ni en el repo.
6. **En serie**: una rama + un PR a la vez, no lanzar tareas de código en paralelo.

---

## 8. Documentos relacionados

- **`DOCUMENTATION.md`** — estado **actual** y verificado del código (fuente de verdad del "ahora").
- **`CHANGELOG.md`** — historial de cambios por versión (Keep a Changelog).
- **`README.md`** — intro, setup y endpoints del repo (GitHub main page).