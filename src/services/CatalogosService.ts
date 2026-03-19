import ApiService from './ApiService'

export async function obtenerMunicipiosCatalogo(signal?: AbortSignal) {
    return ApiService.fetchDataWithAxios<string[]>({
        url: '/catalogos/municipios',
        method: 'get',
        params: {
            limit: 10000,
        },
        signal,
    })
}

export async function obtenerTiposCargaCatalogo(signal?: AbortSignal) {
    return ApiService.fetchDataWithAxios<string[]>({
        url: '/catalogos/tipos-carga',
        method: 'get',
        params: {
            limit: 10000,
        },
        signal,
    })
}

export async function obtenerTiposVehiculoCatalogo(signal?: AbortSignal) {
    return ApiService.fetchDataWithAxios<string[]>({
        url: '/catalogos/tipos-vehiculo',
        method: 'get',
        params: {
            limit: 10000,
        },
        signal,
    })
}
