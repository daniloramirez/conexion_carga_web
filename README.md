# Conexión Carga Web

Panel administrativo web de **Conexión Carga**, construido sobre **React 19 + TypeScript + Vite**.

Este proyecto concentra la operación administrativa del ecosistema Conexión Carga: dashboard, gestión de viajes, historial de eliminaciones, usuarios, perfil, puntos por referidos y utilidades de exportación.

## Vista general

Conexión Carga Web consume el backend compartido del proyecto y está pensado para uso administrativo. La aplicación móvil existe en un repositorio/carpeta separada y **no hace parte de este frontend**.

### Módulos principales

- **Inicio / Dashboard**
  - métricas de viajes
  - gráficos por periodo
  - rankings históricos
- **Administración de Viajes**
  - listado, búsqueda, filtros y exportación
  - ver detalle, editar, crear y eliminar con trazabilidad
- **Historial de Viajes Eliminados**
  - consulta de eliminaciones con causal, observación y filtros
- **Administración de Usuarios**
  - creación, edición, habilitar/inhabilitar y exportación
- **Puntos por referidos**
  - ranking por puntos
  - visualización de referidos reales vía `referred_by_id`
- **Perfil**
  - actualización de datos básicos
  - cambio de contraseña
  - foto de perfil

## Stack

- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **React Router**
- **Axios**
- **React Select**
- **ApexCharts**
- **React Icons**
- **XLSX** para exportación a Excel

## Requisitos

- **Node.js 20+** recomendado
- **npm 10+**
- Backend de Conexión Carga disponible localmente en `http://localhost:3001`

## Instalación

```bash
npm install
```

## Variables de entorno

El proyecto usa un archivo `.env` en la raíz. Actualmente incluye variables `VITE_*` relacionadas con Firebase y configuración del frontend.

Ejemplo de uso:

```env
VITE_FIREBASE_API_KEY=***
VITE_FIREBASE_AUTH_DOMAIN=***
VITE_FIREBASE_PROJECT_ID=***
```

Nota:

- No publiques credenciales reales.
- Si vas a compartir este proyecto, usa un `.env.example` sanitizado.

## Desarrollo local

```bash
npm run dev
```

Vite levanta el frontend y proxyea:

- `/api` -> `http://localhost:3001`
- `/uploads` -> `http://localhost:3001`

Esto permite trabajar localmente contra el backend sin cambiar los servicios frontend.

## Build

```bash
npm run build
```

La salida de producción se genera en:

```bash
build/
```

## Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm run prettier
npm run prettier:fix
npm run lint
npm run lint:fix
npm run format
```

## Estructura principal

```text
src/
  @types/                 Tipos TypeScript del dominio
  assets/                 Estilos, SVG y recursos estáticos
  auth/                   Sesión y autenticación del panel
  components/             Componentes base, compartidos y del template
  configs/                Rutas, navegación, endpoints y configuración general
  constants/              Constantes de negocio/UI
  locales/                Archivos de idioma
  services/               Cliente API y servicios por módulo
  store/                  Estado global
  theme/                  Tema visual del template
  utils/                  Utilidades y hooks
  views/
    admin/                Vistas administrativas reales del proyecto
    auth/                 Login, recuperación, etc.
```

## Rutas principales del panel

Rutas protegidas relevantes:

- `/dashboard`
- `/perfil`
- `/viajes`
- `/viajes/eliminados`
- `/usuarios`
- `/puntos-referidos`

La ruta `/informes` existe en código, aunque puede estar oculta temporalmente desde el menú según configuración del proyecto.

## Integración con backend

El frontend trabaja con `apiPrefix = /api` y consume endpoints del backend compartido.

Algunos grupos de endpoints usados por el panel:

- `POST /api/auth/login-admin`
- `GET /api/me/profile`
- `GET /api/admin/dashboard/...`
- `GET /api/admin/viajes/...`
- `GET /api/admin/usuarios/...`
- `GET /api/admin/puntos/...`
- `GET /api/catalogos/...`

## Convenciones del proyecto

- La UI debe mantenerse consistente.
- Los textos visibles se manejan en **español**
- Se priorizan cambios **incrementales** y fáciles de revertir
- El backend compartido con móvil **no debe romperse**
- Cuando una funcionalidad administrativa necesita backend nuevo, se prefiere el enfoque **add-only** bajo `/api/admin/...`

## Recomendaciones de trabajo

Antes de modificar un módulo:

1. revisa la vista en `src/views/admin`
2. identifica el servicio correspondiente en `src/services`
3. valida los tipos en `src/@types`
4. confirma si la lógica depende de backend, catálogo o exportación
5. ejecuta `npm run build` antes de cerrar cambios

## Estado del proyecto

Este frontend ya incluye módulos administrativos funcionales para:

- dashboard con métricas reales
- administración de viajes
- historial de viajes eliminados
- administración de usuarios
- perfil del usuario autenticado
- puntos por referidos
- exportación a Excel en varios módulos

## Relación con otros proyectos

Dentro del ecosistema Conexión Carga existen al menos estos directorios:

- `conexion_carga_web` -> este repositorio/frontend
- `conexion_carga_back` -> backend FastAPI
- `conexion_carga_app` -> app móvil Flutter

Este README describe únicamente **`conexion_carga_web`**.

## Mantenimiento

Si vas a agregar una nueva funcionalidad:

- intenta reutilizar componentes existentes
- respeta la navegación y patrones visuales actuales
- evita refactors masivos si el cambio puede ser incremental
- documenta scripts SQL en `scripts_sql/` cuando una funcionalidad dependa de base de datos

## Licencia / uso interno

Uso interno del proyecto **Conexión Carga**.

---

Si quieres, el siguiente paso natural es crear también un `README.md` equivalente para `conexion_carga_back`, así ambos repositorios quedan presentables y consistentes en GitHub.
