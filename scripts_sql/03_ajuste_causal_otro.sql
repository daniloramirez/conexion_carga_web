-- ============================================================================
-- Script: 03_ajuste_causal_otro.sql
-- Proyecto: Conexion Carga - Ajuste incremental de causales de eliminacion
-- Motor: PostgreSQL
-- Objetivo:
--   1) Unificar la causal "Otro (Observación libre)" en "Otro"
--   2) Migrar referencias historicas (carga_eliminada.causal_id) a la causal "Otro"
--   3) Inactivar/desactivar variantes legacy sin romper trazabilidad
--
-- IMPORTANTE:
-- - Script idempotente.
-- - Puede ejecutarse en dev para pruebas.
-- - En produccion debe revisarse y ejecutarse de forma controlada.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS conexion_carga;

-- 1) Garantiza que exista la causal canonica "Otro".
INSERT INTO conexion_carga.causales_eliminacion (nombre, descripcion, activo)
SELECT
    'Otro',
    'Motivo no contemplado en causales predefinidas',
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM conexion_carga.causales_eliminacion
    WHERE LOWER(TRIM(nombre)) = LOWER('Otro')
);

-- 2) Activa y normaliza descripcion de la causal canonica "Otro".
UPDATE conexion_carga.causales_eliminacion
SET
    descripcion = 'Motivo no contemplado en causales predefinidas',
    activo = TRUE,
    updated_at = NOW()
WHERE id = (
    SELECT id
    FROM conexion_carga.causales_eliminacion
    WHERE LOWER(TRIM(nombre)) = LOWER('Otro')
    ORDER BY id ASC
    LIMIT 1
);

-- 3) Migra referencias de variantes "Otro (...)" hacia la causal canonica "Otro".
WITH causal_otro AS (
    SELECT id
    FROM conexion_carga.causales_eliminacion
    WHERE LOWER(TRIM(nombre)) = LOWER('Otro')
    ORDER BY id ASC
    LIMIT 1
),
causales_variantes AS (
    SELECT id
    FROM conexion_carga.causales_eliminacion
    WHERE
        LOWER(TRIM(nombre)) IN (
            LOWER('Otro (Observación libre)'),
            LOWER('Otro (Observacion libre)')
        )
)
UPDATE conexion_carga.carga_eliminada ce
SET causal_id = co.id
FROM causal_otro co
WHERE ce.causal_id IN (SELECT id FROM causales_variantes)
  AND ce.causal_id <> co.id;

-- 4) Inactiva variantes legacy "Otro (...)" para no exponer duplicados.
UPDATE conexion_carga.causales_eliminacion
SET
    activo = FALSE,
    updated_at = NOW()
WHERE
    LOWER(TRIM(nombre)) IN (
        LOWER('Otro (Observación libre)'),
        LOWER('Otro (Observacion libre)')
    );

COMMIT;

-- Consultas de verificacion manual:
-- SELECT id, nombre, activo
-- FROM conexion_carga.causales_eliminacion
-- ORDER BY id;
--
-- SELECT causal_id, COUNT(*) AS total
-- FROM conexion_carga.carga_eliminada
-- GROUP BY causal_id
-- ORDER BY causal_id;
