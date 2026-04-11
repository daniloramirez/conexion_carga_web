-- ============================================================================
-- Script: 05_seed_5_viajes_activos.sql
-- Proyecto: Conexion Carga - Seed controlado para dashboard admin
-- Motor: PostgreSQL
-- Objetivo:
--   Insertar minimo 5 viajes activos/publicados para pruebas de metricas.
--
-- IMPORTANTE:
-- - Script idempotente (usa marca en observaciones para evitar duplicados).
-- - Diseñado para ambientes de desarrollo/pruebas.
-- - No ejecutar directamente en produccion sin validacion previa.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS conexion_carga;

WITH usuario_base AS (
    SELECT u.id
    FROM conexion_carga.users u
    WHERE u.active = TRUE
    ORDER BY u.created_at DESC
    LIMIT 1
),
datos_seed AS (
    SELECT *
    FROM (
        VALUES
            (
                'Medellín',
                'Bogotá',
                'Carga general',
                12.500::numeric,
                1200000::numeric,
                'SEED_CC_ACTIVO_20260302_01',
                INTERVAL '1 day'
            ),
            (
                'Cali',
                'Barranquilla',
                'Alimentos perecederos',
                9.750::numeric,
                1450000::numeric,
                'SEED_CC_ACTIVO_20260302_02',
                INTERVAL '2 days'
            ),
            (
                'Cartagena',
                'Medellín',
                'Insumos industriales',
                15.300::numeric,
                2150000::numeric,
                'SEED_CC_ACTIVO_20260302_03',
                INTERVAL '3 days'
            ),
            (
                'Bucaramanga',
                'Cúcuta',
                'Material de construcción',
                11.000::numeric,
                980000::numeric,
                'SEED_CC_ACTIVO_20260302_04',
                INTERVAL '4 days'
            ),
            (
                'Pereira',
                'Manizales',
                'Carga liviana',
                6.200::numeric,
                620000::numeric,
                'SEED_CC_ACTIVO_20260302_05',
                INTERVAL '5 days'
            )
    ) AS t(
        origen,
        destino,
        tipo_carga,
        peso,
        valor,
        marca_seed,
        desfase_tiempo
    )
)
INSERT INTO conexion_carga.carga (
    origen,
    destino,
    tipo_carga,
    peso,
    valor,
    comercial_id,
    estado,
    activo,
    premium_trip,
    comercial,
    contacto,
    tipo_vehiculo,
    observaciones,
    conductor,
    duracion_publicacion,
    created_at,
    updated_at
)
SELECT
    d.origen,
    d.destino,
    d.tipo_carga,
    d.peso,
    d.valor,
    u.id,
    'publicado',
    TRUE,
    FALSE,
    'Equipo Admin Web',
    '3000000000',
    'Camión',
    d.marca_seed,
    'Conductor Seed',
    INTERVAL '24 hours',
    NOW() - d.desfase_tiempo,
    NOW() - d.desfase_tiempo
FROM datos_seed d
CROSS JOIN usuario_base u
WHERE NOT EXISTS (
    SELECT 1
    FROM conexion_carga.carga c
    WHERE c.observaciones = d.marca_seed
);

COMMIT;

-- Verificacion manual:
-- SELECT COUNT(*) AS total_seed
-- FROM conexion_carga.carga
-- WHERE observaciones LIKE 'SEED_CC_ACTIVO_20260302_%';
