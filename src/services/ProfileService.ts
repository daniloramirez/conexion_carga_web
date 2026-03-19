import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type {
    ActualizarPerfilPayload,
    CambiarPasswordPerfilPayload,
    MensajePerfil,
    PerfilActual,
} from '@/@types/profile'

export async function obtenerMiPerfil() {
    return ApiService.fetchDataWithAxios<PerfilActual>({
        url: endpointConfig.meProfile,
        method: 'get',
    })
}

export async function actualizarMiPerfil(data: ActualizarPerfilPayload) {
    return ApiService.fetchDataWithAxios<PerfilActual>({
        url: endpointConfig.meProfile,
        method: 'put',
        data,
    })
}

export async function cambiarMiPassword(data: CambiarPasswordPerfilPayload) {
    return ApiService.fetchDataWithAxios<MensajePerfil>({
        url: endpointConfig.meProfilePassword,
        method: 'put',
        data,
    })
}

export async function subirMiFotoPerfil(file: File) {
    const formData = new FormData()
    formData.append('archivo', file)

    return ApiService.fetchDataWithAxios<PerfilActual>({
        url: endpointConfig.meProfilePhoto,
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

export async function eliminarMiFotoPerfil() {
    return ApiService.fetchDataWithAxios<PerfilActual>({
        url: endpointConfig.meProfilePhoto,
        method: 'delete',
    })
}
