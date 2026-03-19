export type PeriodoDashboard = 'mes' | 'semana' | 'anual'
export type FiltroDashboard =
    | 'publicados'
    | 'activos'
    | 'inactivos'
    | 'eliminados'

export type TarjetasDashboard = {
    viajes_publicados: number
    viajes_activos: number
    viajes_inactivos: number
    viajes_eliminados: number
}

export type PuntoSerieDashboard = {
    label: string
    value: number
}

export type ResumenDashboardResponse = {
    periodo: PeriodoDashboard
    estado: FiltroDashboard
    tarjetas: TarjetasDashboard
    serie: PuntoSerieDashboard[]
}

export type UltimoViajePublicado = {
    id: string
    origen: string
    destino: string
    valor: number
    estado: 'activo' | 'inactivo'
    fecha_publicacion: string
}

export type TopHistoricoDashboard = {
    label: string
    secondary_label?: string | null
    total: number
}
