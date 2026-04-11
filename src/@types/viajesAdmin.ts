export type EstadoViajeAdmin = 'activo' | 'inactivo'
export type EstadoFiltroViajeAdmin = 'todos' | 'activo' | 'inactivo'

export type ViajeAdmin = {
    id: string
    empresa_id: string | null
    comercial_id: string
    origen: string
    destino: string
    tipo_carga: string
    peso: number
    valor: number
    comercial: string | null
    contacto: string | null
    observaciones: string | null
    conductor: string | null
    tipo_vehiculo: string | null
    premium_trip: boolean
    duration_hours: number
    duracion_publicacion?: number | null
    duracion_publicacion_unidad?: 'minutos' | 'horas' | null
    estado: EstadoViajeAdmin
    created_at?: string | null
    fecha_publicacion: string
    expires_at?: string | null
    updated_at: string
}

export type ListaViajesAdminResponse = {
    total: number
    page: number
    page_size: number
    items: ViajeAdmin[]
}

export type CausalEliminacion = {
    id: number
    nombre: string
    descripcion?: string | null
}

export type ActualizarViajeAdminPayload = {
    empresa_id?: string
    origen?: string
    destino?: string
    tipo_carga?: string
    peso?: number
    valor?: number
    comercial?: string
    contacto?: string
    observaciones?: string
    conductor?: string
    tipo_vehiculo?: string
    premium_trip?: boolean
    duration_hours?: number
}

export type CrearViajeAdminPayload = {
    empresa?: string
    empresa_id?: string
    origen: string
    destino: string
    tipo_carga: string
    peso: number
    valor: number
    comercial?: string
    contacto?: string
    observaciones?: string
    conductor?: string
    tipo_vehiculo?: string
    premium_trip?: boolean
    duration_hours?: number
}

export type EliminarViajeAdminPayload = {
    causal_id: number
    observacion?: string
}

export type EliminarViajeAdminResponse = {
    ok: boolean
    message: string
    carga_eliminada_id: string
}

export type ViajeEliminadoAdmin = {
    id: string
    carga_id: string
    causal_id: number
    causal_nombre: string
    observacion?: string | null
    eliminado_por?: string | null
    eliminado_en: string
    origen?: string | null
    destino?: string | null
    valor: number
}

export type ViajeEliminadoAdminDetalle = ViajeEliminadoAdmin & {
    tipo_carga?: string | null
    estado?: EstadoViajeAdmin | null
    fecha_publicacion?: string | null
    snapshot_json?: Record<string, unknown> | null
}

export type ViajeAdminExportacion = {
    id_viaje: string
    usuario?: string | null
    empresa?: string | null
    origen: string
    destino: string
    estado: string
    tipo_carga?: string | null
    valor: number
    fecha_creacion?: string | null
}

export type ViajeEliminadoAdminExportacion = {
    id_viaje: string
    usuario?: string | null
    empresa?: string | null
    origen?: string | null
    destino?: string | null
    causal_eliminacion: string
    observacion?: string | null
    fecha_creacion_viaje?: string | null
    fecha_eliminacion: string
}

export type ListaViajesEliminadosAdminResponse = {
    total: number
    page: number
    page_size: number
    items: ViajeEliminadoAdmin[]
}

export type ObtenerViajesEliminadosAdminParams = {
    q?: string
    causal_id?: number
    fecha_desde?: string
    fecha_hasta?: string
    page?: number
    page_size?: number
}
