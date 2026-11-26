-- Propuesta de tablas para las cuentas reales de Solara (Cloudflare D1 / SQLite).
-- Todavía NO está en uso: el sitio publicado es estático y el panel «Mi cuenta» usa una cuenta
-- de demostración. Para aplicarla: wrangler d1 create solara && wrangler d1 execute solara --file=cloudflare/schema.sql
-- Las contraseñas nunca se guardan en texto: solo su hash (por ejemplo, PBKDF2 o Argon2 con sal).

PRAGMA foreign_keys = ON;

-- Personas con cuenta.
CREATE TABLE users (
    id              TEXT PRIMARY KEY,                 -- UUID
    email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email_verified  INTEGER NOT NULL DEFAULT 0,       -- 0/1
    password_hash   TEXT,                             -- NULL si entra solo con un proveedor externo
    full_name       TEXT NOT NULL,
    country         TEXT,                             -- ISO 3166-1, por ejemplo CR o US
    language        TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
    role            TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'org_admin')),
    organization_id TEXT REFERENCES organizations(id),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at   TEXT
);

-- Sesiones activas (la cookie del navegador guarda solo el token, nunca la contraseña).
CREATE TABLE sessions (
    token_hash  TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT NOT NULL,
    user_agent  TEXT
);

-- Instituciones (escuelas, campamentos, ONG) para la capacitación institucional.
CREATE TABLE organizations (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    type        TEXT CHECK (type IN ('school', 'camp', 'ngo', 'company', 'public')),
    country     TEXT,
    seats       INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Catálogo. Los textos pueden seguir en site/data.js; aquí va lo que el servidor necesita validar.
CREATE TABLE courses (
    id          TEXT PRIMARY KEY,                     -- mismo id que en site/data.js
    title       TEXT NOT NULL,
    price_cents INTEGER,                              -- NULL = sin precio definido
    currency    TEXT NOT NULL DEFAULT 'USD',
    status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sample', 'published', 'archived'))
);

CREATE TABLE lessons (
    id          TEXT PRIMARY KEY,
    course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    title       TEXT NOT NULL,
    video_key   TEXT,                                 -- archivo en R2 con acceso controlado
    duration_s  INTEGER,
    is_free     INTEGER NOT NULL DEFAULT 0,           -- clase de muestra pública
    UNIQUE (course_id, position)
);

-- Pedidos y pagos. El total se calcula en el servidor, nunca se acepta el del navegador.
CREATE TABLE orders (
    id              TEXT PRIMARY KEY,                 -- por ejemplo SOL-2026-0001
    user_id         TEXT NOT NULL REFERENCES users(id),
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
    subtotal_cents  INTEGER NOT NULL,
    tax_cents       INTEGER NOT NULL DEFAULT 0,
    total_cents     INTEGER NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'USD',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at         TEXT
);

CREATE TABLE order_items (
    order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    course_id    TEXT NOT NULL REFERENCES courses(id),
    price_cents  INTEGER NOT NULL,                    -- precio al momento de la compra
    PRIMARY KEY (order_id, course_id)
);

CREATE TABLE payments (
    id                TEXT PRIMARY KEY,
    order_id          TEXT NOT NULL REFERENCES orders(id),
    provider          TEXT NOT NULL CHECK (provider IN ('paypal')),
    provider_order_id TEXT NOT NULL UNIQUE,           -- id de la orden en PayPal
    provider_capture  TEXT,                           -- id de la captura confirmada
    amount_cents      INTEGER NOT NULL,
    currency          TEXT NOT NULL,
    status            TEXT NOT NULL CHECK (status IN ('created', 'captured', 'failed', 'refunded')),
    raw_event         TEXT,                           -- respuesta del proveedor, para auditoría
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Acceso a cursos: por compra, por beca, por la organización o gratuito.
CREATE TABLE enrollments (
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id   TEXT NOT NULL REFERENCES courses(id),
    source      TEXT NOT NULL CHECK (source IN ('purchase', 'scholarship', 'organization', 'free')),
    order_id    TEXT REFERENCES orders(id),
    granted_at  TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT,
    PRIMARY KEY (user_id, course_id)
);

-- Progreso por clase: base de todas las estadísticas del panel.
CREATE TABLE lesson_progress (
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id     TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    watched_s     INTEGER NOT NULL DEFAULT 0,
    completed_at  TEXT,
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, lesson_id)
);

-- Certificados de finalización (no son acreditaciones oficiales; ver Documento Maestro, sección 08).
CREATE TABLE certificates (
    id            TEXT PRIMARY KEY,                   -- código verificable
    user_id       TEXT NOT NULL REFERENCES users(id),
    course_id     TEXT NOT NULL REFERENCES courses(id),
    kind          TEXT NOT NULL DEFAULT 'completion' CHECK (kind IN ('completion', 'program')),
    issued_at     TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, course_id, kind)
);

-- Becas del programa de responsabilidad social.
CREATE TABLE scholarships (
    id              TEXT PRIMARY KEY,
    course_id       TEXT NOT NULL REFERENCES courses(id),
    organization_id TEXT REFERENCES organizations(id),
    seats           INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

-- Lista de deseos (cursos guardados para cuando estén disponibles).
CREATE TABLE wishlist (
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id  TEXT NOT NULL REFERENCES courses(id),
    added_at   TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, course_id)
);

CREATE INDEX idx_orders_user ON orders(user_id, created_at);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_progress_user ON lesson_progress(user_id, updated_at);

-- Estadísticas del panel «Mi cuenta» a partir de estas tablas:
--   cursos activos      = COUNT(enrollments) del usuario
--   clases completadas  = COUNT(lesson_progress con completed_at)
--   progreso por curso  = clases completadas / clases del curso
--   tiempo de estudio   = SUM(lesson_progress.watched_s)
--   total pagado        = SUM(orders.total_cents con status = 'paid')
--   certificados        = COUNT(certificates)
