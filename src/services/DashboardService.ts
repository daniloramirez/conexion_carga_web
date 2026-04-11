import ApiService from './ApiService'
import type {
    FiltroDashboard,
    PeriodoDashboard,
    ResumenDashboardResponse,
    TopHistoricoDashboard,
    UltimoViajePublicado,
} from '@/@types/dashboard'

export async function obtenerResumenDashboard(
    periodo: PeriodoDashboard,
    estado: FiltroDashboard,
) {
    return ApiService.fetchDataWithAxios<ResumenDashboardResponse>({
        url: '/admin/dashboard/resumen',
        method: 'get',
        params: { periodo, estado },
    })
}

export async function obtenerUltimosViajesPublicados(limit = 8) {
    return ApiService.fetchDataWithAxios<UltimoViajePublicado[]>({
        url: '/admin/dashboard/ultimos-viajes',
        method: 'get',
        params: { limit },
    })
}

export async function obtenerTopUsuariosPublicadores(limit = 10) {
    return ApiService.fetchDataWithAxios<TopHistoricoDashboard[]>({
        url: '/admin/dashboard/top-usuarios-publicadores',
        method: 'get',
        params: { limit },
    })
}

export async function obtenerTopRutasPublicadas(limit = 10) {
    return ApiService.fetchDataWithAxios<TopHistoricoDashboard[]>({
        url: '/admin/dashboard/top-rutas-publicadas',
        method: 'get',
        params: { limit },
    })
}

export async function obtenerTopEmpresasPublicadoras(limit = 10) {
    return ApiService.fetchDataWithAxios<TopHistoricoDashboard[]>({
        url: '/admin/dashboard/top-empresas-publicadoras',
        method: 'get',
        params: { limit },
    })
}
