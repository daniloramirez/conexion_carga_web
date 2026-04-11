import ApiService from './ApiService'

export type CountryCodeCatalogItem = {
    id: number
    name: string
    iso2: string
    phone_code: string
    flag_emoji: string
}

export async function obtenerCodigosPaisCatalogo(signal?: AbortSignal) {
    return ApiService.fetchDataWithAxios<CountryCodeCatalogItem[]>({
        url: '/catalogos/country-codes',
        method: 'get',
        signal,
    })
}

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
