ALTER TABLE IF EXISTS conexion_carga.users
ADD COLUMN IF NOT EXISTS foto VARCHAR(500) NULL;

COMMENT ON COLUMN conexion_carga.users.foto
IS 'Ruta o URL de la foto de perfil del usuario para el panel web.';
