import type { User } from '@/@types/auth'
import type { PerfilActual } from '@/@types/profile'

export const resolverUrlFotoPerfil = (foto?: string | null): string => {
    const valor = String(foto || '').trim()

    if (!valor) {
        return ''
    }

    if (valor.startsWith('http://') || valor.startsWith('https://')) {
        return valor
    }

    const origenBackend = (() => {
        if (typeof window === 'undefined') {
            return ''
        }

        const configurado = import.meta.env.VITE_BACKEND_ORIGIN
        if (configurado) {
            return String(configurado).replace(/\/$/, '')
        }

        if (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1'
        ) {
            return 'http://localhost:3001'
        }

        return window.location.origin
    })()

    if (!origenBackend) {
        return valor
    }

    if (valor.startsWith('/')) {
        return `${origenBackend}${valor}`
    }

    return `${origenBackend}/${valor.replace(/^\/+/, '')}`
}

export const construirUsuarioSesionDesdePerfil = (
    perfil?: Partial<PerfilActual>,
): User => {
    const firstName = perfil?.first_name || ''
    const lastName = perfil?.last_name || ''
    const fullName =
        perfil?.full_name ||
        `${firstName} ${lastName}`.trim() ||
        perfil?.email ||
        ''

    return {
        userId: perfil?.id || '',
        avatar: resolverUrlFotoPerfil(perfil?.foto_url || perfil?.foto || ''),
        email: perfil?.email || '',
        userName: fullName,
        firstName,
        lastName,
    }
}
