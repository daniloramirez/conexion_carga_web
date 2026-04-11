-- 1. Agregar columna document
ALTER TABLE IF EXISTS conexion_carga.users
ADD COLUMN IF NOT EXISTS document VARCHAR(80) NULL;

COMMENT ON COLUMN conexion_carga.users.document
IS 'Identificación del usuario. Se separa del campo phone, que ahora almacena el número de WhatsApp en formato internacional.';

-- 2. Crear tabla de códigos de país
CREATE TABLE IF NOT EXISTS conexion_carga.country_codes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    iso2 VARCHAR(5) NOT NULL,
    phone_code VARCHAR(10) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_country_codes_iso2
    ON conexion_carga.country_codes (LOWER(iso2));

CREATE UNIQUE INDEX IF NOT EXISTS uq_country_codes_phone_code_name
    ON conexion_carga.country_codes (LOWER(name), phone_code);

-- 3. Seeder básico
INSERT INTO conexion_carga.country_codes (name, iso2, phone_code, flag_emoji) VALUES
('Colombia', 'CO', '+57', '🇨🇴'),
('México', 'MX', '+52', '🇲🇽'),
('Argentina', 'AR', '+54', '🇦🇷'),
('Chile', 'CL', '+56', '🇨🇱'),
('Perú', 'PE', '+51', '🇵🇪'),
('Ecuador', 'EC', '+593', '🇪🇨'),
('Venezuela', 'VE', '+58', '🇻🇪'),
('Bolivia', 'BO', '+591', '🇧🇴'),
('Paraguay', 'PY', '+595', '🇵🇾'),
('Uruguay', 'UY', '+598', '🇺🇾'),
('Brasil', 'BR', '+55', '🇧🇷'),
('Panamá', 'PA', '+507', '🇵🇦'),
('Costa Rica', 'CR', '+506', '🇨🇷'),
('Guatemala', 'GT', '+502', '🇬🇹'),
('El Salvador', 'SV', '+503', '🇸🇻'),
('Honduras', 'HN', '+504', '🇭🇳'),
('Nicaragua', 'NI', '+505', '🇳🇮'),
('República Dominicana', 'DO', '+1', '🇩🇴'),
('Estados Unidos', 'US', '+1', '🇺🇸'),
('Canadá', 'CA', '+1', '🇨🇦'),
('España', 'ES', '+34', '🇪🇸'),
('Francia', 'FR', '+33', '🇫🇷'),
('Alemania', 'DE', '+49', '🇩🇪'),
('Italia', 'IT', '+39', '🇮🇹'),
('Reino Unido', 'GB', '+44', '🇬🇧')
ON CONFLICT DO NOTHING;

-- 4. Migrar datos existentes
UPDATE conexion_carga.users
SET document = phone
WHERE phone IS NOT NULL
  AND TRIM(phone) <> ''
  AND (document IS NULL OR TRIM(document) = '');

-- 5. Limpiar phone
UPDATE conexion_carga.users
SET phone = NULL
WHERE phone IS NOT NULL;
