-- ============================================================================
-- Script: 06_seed_10_viajes_activos_basados_en_existentes.sql
-- Proyecto: Conexion Carga - Seed de 10 viajes activos basado en datos reales
-- Motor: PostgreSQL
-- Objetivo:
--   Insertar 10 registros nuevos en conexion_carga.carga tomando como base
--   registros existentes, dejandolos en estado publicado y activo.
--
-- IMPORTANTE:
-- - Script idempotente (usa marca unica en observaciones).
-- - Diseñado para entorno de desarrollo/pruebas.
-- - No ejecutar en produccion sin validacion previa.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS conexion_carga;

WITH base AS (
    SELECT
        c.empresa_id,
        c.origen,
        c.destino,
        c.peso,
        c.valor,
        c.comercial_id,
        c.conductor_id,
        c.premium_trip,
        c.duracion_publicacion,
        c.comercial,
        c.contacto,
        c.tipo_vehiculo,
        c.tipo_carga,
        c.conductor,
        c.empresa,
        ROW_NUMBER() OVER (ORDER BY c.created_at DESC, c.id) AS rn
    FROM conexion_carga.carga c
    WHERE c.estado = 'publicado'
    ORDER BY c.created_at DESC, c.id
    LIMIT 10
),
datos_seed AS (
    SELECT
        b.*,
        CONCAT('SEED_CC_10_ACTIVOS_20260303_', LPAD(b.rn::text, 2, '0')) AS marca_seed
    FROM base b
)
INSERT INTO conexion_carga.carga (
    empresa_id,
    origen,
    destino,
    peso,
    valor,
    comercial_id,
    conductor_id,
    estado,
    activo,
    created_at,
    updated_at,
    premium_trip,
    duracion_publicacion,
    comercial,
    contacto,
    tipo_vehiculo,
    observaciones,
    tipo_carga,
    conductor,
    empresa
)
SELECT
    ds.empresa_id,
    ds.origen,
    ds.destino,
    ds.peso,
    ds.valor,
    ds.comercial_id,
    ds.conductor_id,
    'publicado',
    TRUE,
    NOW() - (ds.rn * INTERVAL '1 minute'),
    NOW() - (ds.rn * INTERVAL '1 minute'),
    COALESCE(ds.premium_trip, FALSE),
    COALESCE(ds.duracion_publicacion, INTERVAL '24 hours'),
    ds.comercial,
    ds.contacto,
    ds.tipo_vehiculo,
    ds.marca_seed,
    ds.tipo_carga,
    ds.conductor,
    ds.empresa
FROM datos_seed ds
WHERE NOT EXISTS (
    SELECT 1
    FROM conexion_carga.carga c2
    WHERE c2.observaciones = ds.marca_seed
);

COMMIT;

-- Verificacion manual:
-- SELECT COUNT(*) AS total_seed
-- FROM conexion_carga.carga
-- WHERE observaciones LIKE 'SEED_CC_10_ACTIVOS_20260303_%';
--
-- SELECT id, origen, destino, estado, activo, created_at
-- FROM conexion_carga.carga
-- WHERE observaciones LIKE 'SEED_CC_10_ACTIVOS_20260303_%'
-- ORDER BY created_at DESC;
