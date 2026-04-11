import ApiService from './ApiService'
import type {
    ActualizarPuntosReferidosPayload,
    ActualizarPuntosReferidosResponse,
    ListaReferidosResponse,
    ListaPuntosReferidosResponse,
    ObtenerPuntosReferidosParams,
    QuitarReferidoResponse,
} from '@/@types/puntosReferidos'

export async function obtenerPuntosReferidos(
    params: ObtenerPuntosReferidosParams,
    signal?: AbortSignal,
) {
    return ApiService.fetchDataWithAxios<ListaPuntosReferidosResponse>({
        url: '/admin/puntos',
        method: 'get',
        params,
        signal,
    })
}

export async function actualizarPuntosReferidos(
    usuarioId: string,
    payload: ActualizarPuntosReferidosPayload,
) {
    return ApiService.fetchDataWithAxios<ActualizarPuntosReferidosResponse>({
        url: `/admin/puntos/${usuarioId}`,
        method: 'patch',
        data: payload,
    })
}

export async function quitarPuntosReferidos(usuarioId: string) {
    return ApiService.fetchDataWithAxios<ActualizarPuntosReferidosResponse>({
        url: `/admin/puntos/${usuarioId}/quitar`,
        method: 'post',
    })
}

export async function obtenerReferidosDeUsuario(
    usuarioId: string,
    signal?: AbortSignal,
) {
    return ApiService.fetchDataWithAxios<ListaReferidosResponse>({
        url: `/admin/puntos/${usuarioId}/referidos`,
        method: 'get',
        signal,
    })
}

export async function quitarReferidoDeUsuario(
    usuarioId: string,
    referidoId: string,
) {
    return ApiService.fetchDataWithAxios<QuitarReferidoResponse>({
        url: `/admin/puntos/${usuarioId}/referidos/${referidoId}/quitar`,
        method: 'post',
    })
}
