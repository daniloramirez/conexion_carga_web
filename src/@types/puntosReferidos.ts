export type UsuarioPuntosReferidos = {
    id: string
    email: string
    first_name: string
    last_name: string
    document?: string | null
    phone?: string | null
    company_name?: string | null
    active: boolean
    created_at: string
    points: number
    referred_count: number
}

export type ListaPuntosReferidosResponse = {
    total: number
    page: number
    page_size: number
    items: UsuarioPuntosReferidos[]
}

export type ObtenerPuntosReferidosParams = {
    q?: string
    page?: number
    page_size?: number
}

export type ActualizarPuntosReferidosPayload = {
    points: number
}

export type ActualizarPuntosReferidosResponse = {
    ok: boolean
    message: string
    user: UsuarioPuntosReferidos
}

export type UsuarioReferido = {
    id: string
    email: string
    first_name: string
    last_name: string
    document?: string | null
    phone?: string | null
    company_name?: string | null
    active: boolean
    created_at: string
}

export type ListaReferidosResponse = {
    total: number
    items: UsuarioReferido[]
}

export type QuitarReferidoResponse = {
    ok: boolean
    message: string
    parent_user: UsuarioPuntosReferidos
    removed_referred_id: string
}
