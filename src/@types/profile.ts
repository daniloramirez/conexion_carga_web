export type PerfilActual = {
    id: string
    first_name: string
    last_name: string
    full_name: string
    email: string
    phone?: string | null
    is_company: boolean
    company_name?: string | null
    active: boolean
    created_at: string
    foto?: string | null
    foto_url?: string | null
}

export type ActualizarPerfilPayload = {
    first_name: string
    last_name: string
    phone?: string | null
    company_name?: string | null
}

export type CambiarPasswordPerfilPayload = {
    password_actual: string
    nueva_password: string
    confirmar_nueva_password: string
}

export type MensajePerfil = {
    message: string
}
