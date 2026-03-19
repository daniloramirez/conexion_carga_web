import ApiService from './ApiService'
import type {
    ActualizarViajeAdminPayload,
    CausalEliminacion,
    CrearViajeAdminPayload,
    EliminarViajeAdminPayload,
    EliminarViajeAdminResponse,
    EstadoFiltroViajeAdmin,
    ListaViajesEliminadosAdminResponse,
    ObtenerViajesEliminadosAdminParams,
    ListaViajesAdminResponse,
    ViajeAdminExportacion,
    ViajeAdmin,
    ViajeEliminadoAdminDetalle,
    ViajeEliminadoAdminExportacion,
} from '@/@types/viajesAdmin'

type ObtenerViajesAdminParams = {
    q?: string
    estado?: EstadoFiltroViajeAdmin
    page?: number
    page_size?: number
}

export async function obtenerViajesAdministracion(
    params: ObtenerViajesAdminParams,
    signal?: AbortSignal,
) {
    return ApiService.fetchDataWithAxios<ListaViajesAdminResponse>({
        url: '/admin/viajes',
        method: 'get',
        params,
        signal,
    })
}

export async function obtenerSugerenciasEmpresasViajesAdministracion(
    params?: {
        q?: string
        limit?: number
    },
    signal?: AbortSignal,
) {
    return ApiService.fetchDataWithAxios<string[]>({
        url: '/admin/viajes/sugerencias/empresas',
        method: 'get',
        params,
        signal,
    })
}

export async function obtenerDetalleViajeAdministracion(
    viajeId: string,
    signal?: AbortSignal,
) {
    return ApiService.fetchDataWithAxios<ViajeAdmin>({
        url: `/admin/viajes/${viajeId}`,
        method: 'get',
        signal,
    })
}

export async function crearViajeAdministracion(
    payload: CrearViajeAdminPayload,
) {
    return ApiService.fetchDataWithAxios<ViajeAdmin>({
        url: '/admin/viajes',
        method: 'post',
        data: payload,
    })
}

export async function actualizarViajeAdministracion(
    viajeId: string,
    payload: ActualizarViajeAdminPayload,
) {
    return ApiService.fetchDataWithAxios<ViajeAdmin>({
        url: `/admin/viajes/${viajeId}`,
        method: 'patch',
        data: payload,
    })
}

export async function eliminarViajeAdministracion(
    viajeId: string,
    payload: EliminarViajeAdminPayload,
) {
    return ApiService.fetchDataWithAxios<EliminarViajeAdminResponse>({
        url: `/admin/viajes/${viajeId}/eliminar`,
        method: 'post',
        data: payload,
    })
}

export async function obtenerCausalesEliminacionAdministracion(
    signal?: AbortSignal,
) {
    return ApiService.fetchDataWithAxios<CausalEliminacion[]>({
        url: '/admin/causales-eliminacion',
        method: 'get',
        signal,
    })
}

export async function obtenerViajesEliminadosAdministracion(
    params: ObtenerViajesEliminadosAdminParams,
    signal?: AbortSignal,
) {
    return ApiService.fetchDataWithAxios<ListaViajesEliminadosAdminResponse>({
        url: '/admin/viajes-eliminados',
        method: 'get',
        params,
        signal,
    })
}

export async function obtenerDetalleViajeEliminadoAdministracion(
    viajeEliminadoId: string,
    signal?: AbortSignal,
) {
    return ApiService.fetchDataWithAxios<ViajeEliminadoAdminDetalle>({
        url: `/admin/viajes-eliminados/${viajeEliminadoId}`,
        method: 'get',
        signal,
    })
}

export async function exportarViajesAdministracion(
    params: ObtenerViajesAdminParams,
) {
    return ApiService.fetchDataWithAxios<ViajeAdminExportacion[]>({
        url: '/admin/viajes/exportacion',
        method: 'get',
        params,
    })
}

export async function exportarViajesEliminadosAdministracion(
    params: Omit<ObtenerViajesEliminadosAdminParams, 'page' | 'page_size'>,
) {
    return ApiService.fetchDataWithAxios<ViajeEliminadoAdminExportacion[]>({
        url: '/admin/viajes-eliminados/exportacion',
        method: 'get',
        params,
    })
}
