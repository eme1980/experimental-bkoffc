# experimental-bkoffc

Backend / backoffice **experimental** de autenticación de usuarios, construido con
**TypeScript + Node.js + Express** bajo **Clean Architecture** y **TDD**, delegando
la autenticación, la persistencia y el envío de email en el BaaS **InsForge**.

> Su objetivo es servir como base de referencia para retomar el desarrollo sin
> pérdida de contexto. La documentación técnica detallada vive en
> [`DOCUMENTATION.md`](./DOCUMENTATION.md).

---

## ✨ Casos de uso

- **Registro** de un nuevo usuario.
- **Login** de un usuario existente.
- **Recuperación de contraseña** (solicitud + confirmación de reset).

---

## 🧱 Stack

| Capa        | Tecnología                                        |
|-------------|---------------------------------------------------|
| Lenguaje    | TypeScript (ESM)                                  |
| HTTP        | Express `^5.2.1`                                  |
| Runtime     | Node.js 18                                        |
| BaaS        | InsForge (`@insforge/sdk ^1.4.2`) — auth, BD, email |
| Build       | esbuild `^0.28.2`                                 |
| Tests       | Vitest `^1.0.0`                                   |

Arquitectura: **Clean Architecture en 2 capas** — el **Core** (entidades + use-cases +
interfaces) está aislado de la **Infraestructura** (controllers + adaptadores de InsForge).
La inyección de dependencias se hace manualmente en un *Composition Root* (`src/index.ts`).

---

## 🚀 Puesta en marcha

### Requisitos
- Node.js 18+
- npm
- Un proyecto **InsForge** (tabla `users` + email configurado)

### Instalación y arranque local

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno (ver .env.example)
export VITE_INSFORGE_URL=https://tu-proyecto.insforge.app   # obligatorio
export VITE_INSFORGE_KEY=tu-anon-key                        # obligatorio
export PORT=3000                                            # opcional
export LOG_LEVEL=info                                       # opcional (debug|info|warn|error)

# 3. Modo desarrollo (watch)
npm run dev

# 4. Build + producción
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

---

## 🔌 Endpoints

> **Sin autenticación previa** — este servicio gestiona precisamente la autenticación.
> Toda petición con `Content-Type: application/json`.

### `GET /`
Health-check / metadatos del API.

```json
{ "name": "Experimental Backoffice API", "version": "1.0.0", "status": "ok" }
```

### `POST /auth/register`
Registra un nuevo usuario.

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

**Éxito `201`**
```json
{
  "token": "access-token",
  "user": { "id": "user-1", "email": "test@example.com" }
}
```

### `POST /auth/login`
Inicia sesión.

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

**Éxito `200`**
```json
{
  "token": "access-token",
  "user": { "id": "user-1", "email": "test@example.com" }
}
```

### `POST /auth/reset-password-request`
Solicita el email de recuperación de contraseña.

```bash
curl -X POST http://localhost:3000/auth/reset-password-request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Éxito `200`**
```json
{ "message": "If the email exists, a recovery link was sent" }
```

### `POST /auth/reset-password`
Confirma el cambio de contraseña con el token recibido por email.

```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"<token-del-email>","password":"NuevaPassword123"}'
```

**Éxito `200`**
```json
{ "message": "Password updated successfully" }
```

### Formato de errores
Todos los errores usan la misma forma:

```json
{ "error": "mensaje descriptivo" }
```

---

## 🧪 Testing

```bash
npm test        # ejecuta la suite (Vitest)
npm run build
```

Suite actual: **26 tests / 7 archivos** (use-cases, entidad y controllers), en verde.

---

## 🗂️ Estructura

```
src/
├── index.ts                     # Composition Root + rutas + arranque
├── core/                        # CAPA CORE (dominio, sin deps externas)
│   ├── entities/User.ts         # Entidad + tipo ResetUser
│   └── use-cases/               # Use-cases + interfaces (contratos)
└── infrastructure/              # CAPA INFRA (adaptadores)
    ├── controllers/             # AuthController, PasswordResetController
    ├── insforge/                # client + InsForgeEmailService
    └── repositories/            # InsForgeAuthRepository, InsForgeUserRepository
tests/                           # Tests (espejo de src/)
```

---

## 📄 Licencia / notas

Proyecto personal de desarrollo. No contiene secretos: credenciales solo en `.env`
(véase `.env.example`, nunca versionado).
