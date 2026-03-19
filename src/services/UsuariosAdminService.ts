import ApiService from './ApiService'
import type {
    ActualizarUsuarioAdminPayload,
    CambiarEstadoUsuarioAdminPayload,
    CambiarEstadoUsuarioAdminResponse,
    CrearUsuarioAdminPayload,
    ListaUsuariosAdminResponse,
    ObtenerUsuariosAdminParams,
    UsuarioAdminExportacion,
    UsuarioAdmin,
} from '@/@types/usuariosAdmin'

export async function obtenerUsuariosAdministracion(
    params: ObtenerUsuariosAdminParams,
    signal?: AbortSignal,
) {
    return ApiService.fetchDataWithAxios<ListaUsuariosAdminResponse>({
        url: '/admin/usuarios',
        method: 'get',
        params,
        signal,
    })
}

export async function obtenerDetalleUsuarioAdministracion(
    usuarioId: string,
    signal?: AbortSignal,
) {
    return ApiService.fetchDataWithAxios<UsuarioAdmin>({
        url: `/admin/usuarios/${usuarioId}`,
        method: 'get',
        signal,
    })
}

export async function crearUsuarioAdministracion(payload: CrearUsuarioAdminPayload) {
    return ApiService.fetchDataWithAxios<UsuarioAdmin>({
        url: '/admin/usuarios',
        method: 'post',
        data: payload,
    })
}

export async function actualizarUsuarioAdministracion(
    usuarioId: string,
    payload: ActualizarUsuarioAdminPayload,
) {
    return ApiService.fetchDataWithAxios<UsuarioAdmin>({
        url: `/admin/usuarios/${usuarioId}`,
        method: 'patch',
        data: payload,
    })
}

export async function cambiarEstadoUsuarioAdministracion(
    usuarioId: string,
    payload: CambiarEstadoUsuarioAdminPayload,
) {
    return ApiService.fetchDataWithAxios<CambiarEstadoUsuarioAdminResponse>({
        url: `/admin/usuarios/${usuarioId}/estado`,
        method: 'patch',
        data: payload,
    })
}

export async function exportarUsuariosAdministracion(
    params: ObtenerUsuariosAdminParams,
) {
    return ApiService.fetchDataWithAxios<UsuarioAdminExportacion[]>({
        url: '/admin/usuarios/exportacion',
        method: 'get',
        params,
    })
}
