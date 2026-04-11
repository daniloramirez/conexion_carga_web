-- ============================================================================
-- Script: 04_renombrar_otro_a_otra.sql
-- Proyecto: Conexion Carga - Ajuste incremental de causal de eliminacion
-- Motor: PostgreSQL
-- Objetivo:
--   1) Renombrar causal "Otro" a "Otra"
--   2) Mantener una sola causal activa "Otra"
--
-- IMPORTANTE:
-- - Script idempotente.
-- - Puede ejecutarse en dev para validacion.
-- - En produccion debe revisarse y ejecutarse de forma controlada.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS conexion_carga;

UPDATE conexion_carga.causales_eliminacion
SET
    nombre = 'Otra',
    updated_at = NOW()
WHERE LOWER(TRIM(nombre)) = LOWER('Otro')
  AND NOT EXISTS (
      SELECT 1
      FROM conexion_carga.causales_eliminacion
      WHERE LOWER(TRIM(nombre)) = LOWER('Otra')
  );

UPDATE conexion_carga.causales_eliminacion
SET
    activo = FALSE,
    updated_at = NOW()
WHERE LOWER(TRIM(nombre)) = LOWER('Otro')
  AND EXISTS (
      SELECT 1
      FROM conexion_carga.causales_eliminacion
      WHERE LOWER(TRIM(nombre)) = LOWER('Otra')
  );

UPDATE conexion_carga.causales_eliminacion
SET
    activo = TRUE,
    updated_at = NOW()
WHERE LOWER(TRIM(nombre)) = LOWER('Otra');

COMMIT;

-- Consulta de verificacion manual:
-- SELECT id, nombre, activo
-- FROM conexion_carga.causales_eliminacion
-- ORDER BY
--     CASE
--         WHEN LOWER(TRIM(nombre)) IN (LOWER('Otro'), LOWER('Otra')) THEN 1
--         ELSE 0
--     END,
--     LOWER(TRIM(nombre)) ASC;
