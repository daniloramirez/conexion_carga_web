export type EstadoFiltroUsuarioAdmin = 'todos' | 'habilitado' | 'inhabilitado'
export type TipoFiltroUsuarioAdmin =
    | 'todos'
    | 'usuario'
    | 'empresa'
    | 'conductor'
    | 'premium'

export type UsuarioAdmin = {
    id: string
    email: string
    first_name: string
    last_name: string
    document?: string | null
    phone?: string | null
    is_company: boolean
    company_name?: string | null
    active: boolean
    created_at: string
    points: number
    is_premium: boolean
    is_driver: boolean
    rol_id?: number | null
    is_admin: boolean
    referred_by_id?: string | null
    referred_by_email?: string | null
}

export type ListaUsuariosAdminResponse = {
    total: number
    page: number
    page_size: number
    items: UsuarioAdmin[]
}

export type ObtenerUsuariosAdminParams = {
    q?: string
    estado?: EstadoFiltroUsuarioAdmin
    tipo?: TipoFiltroUsuarioAdmin
    fecha_desde?: string
    fecha_hasta?: string
    page?: number
    page_size?: number
}

export type CrearUsuarioAdminPayload = {
    first_name: string
    last_name: string
    email: string
    document?: string
    phone?: string
    phone_code?: string
    phone_number?: string
    password: string
    confirm_password?: string
    is_company?: boolean
    company_name?: string
    is_premium?: boolean
    is_driver?: boolean
    is_admin?: boolean
    active?: boolean
}

export type ActualizarUsuarioAdminPayload = {
    first_name?: string
    last_name?: string
    email?: string
    document?: string
    phone?: string
    phone_code?: string
    phone_number?: string
    password?: string
    confirm_password?: string
    is_company?: boolean
    company_name?: string
    is_premium?: boolean
    is_driver?: boolean
    is_admin?: boolean
    active?: boolean
}

export type CambiarEstadoUsuarioAdminPayload = {
    active: boolean
}

export type CambiarEstadoUsuarioAdminResponse = {
    ok: boolean
    message: string
    user: UsuarioAdmin
}

export type UsuarioAdminExportacion = {
    id: string
    nombre_completo: string
    correo: string
    documento?: string | null
    numero_whatsapp?: string | null
    empresa?: string | null
    tipo: string
    estado: string
    puntos: number
    fecha_creacion: string
}
