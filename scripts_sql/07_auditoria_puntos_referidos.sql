-- Proyecto: Conexion Carga - Auditoria de puntos por referidos
-- Objetivo:
--   1) Crear una tabla minima de trazabilidad para cambios manuales de puntos
--   2) No afectar la logica actual de usuarios ni contratos moviles
--   3) Permitir que el panel admin registre actualizaciones y reinicios de puntos
-- Nota:
--   Este script NO se ejecuta automaticamente. Debe revisarse y ejecutarse manualmente.

CREATE TABLE IF NOT EXISTS conexion_carga.auditoria_puntos_referidos (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES conexion_carga.users(id) ON DELETE CASCADE,
    admin_user_id UUID NULL REFERENCES conexion_carga.users(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL,
    puntos_anteriores INTEGER NOT NULL DEFAULT 0,
    puntos_nuevos INTEGER NOT NULL DEFAULT 0,
    detalle TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_puntos_referidos_user_id
    ON conexion_carga.auditoria_puntos_referidos (user_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_puntos_referidos_admin_user_id
    ON conexion_carga.auditoria_puntos_referidos (admin_user_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_puntos_referidos_created_at
    ON conexion_carga.auditoria_puntos_referidos (created_at DESC);
