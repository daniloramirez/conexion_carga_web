import { useEffect, useRef, useImperativeHandle, useState } from 'react'
import AuthContext from './AuthContext'
import appConfig from '@/configs/app.config'
import { useSessionUser, useToken } from '@/store/authStore'
import { apiSignIn, apiSignOut, apiSignUp } from '@/services/AuthService'
import { obtenerMiPerfil } from '@/services/ProfileService'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useNavigate } from 'react-router'
import { construirUsuarioSesionDesdePerfil } from '@/utils/perfilSesion'
import type {
    SignInCredential,
    SignUpCredential,
    AuthResult,
    OauthSignInCallbackPayload,
    AuthUserResponse,
    User,
    Token,
} from '@/@types/auth'
import type { ReactNode, Ref } from 'react'
import type { NavigateFunction } from 'react-router'

type AuthProviderProps = { children: ReactNode }

export type IsolatedNavigatorRef = {
    navigate: NavigateFunction
}

const IsolatedNavigator = ({ ref }: { ref: Ref<IsolatedNavigatorRef> }) => {
    const navigate = useNavigate()

    useImperativeHandle(ref, () => {
        return {
            navigate,
        }
    }, [navigate])

    return <></>
}

const obtenerTokenDeRespuesta = (payload?: {
    access_token?: string
    token?: string
}) => {
    return payload?.access_token || payload?.token || ''
}

const construirUsuarioSesion = (payload?: AuthUserResponse): User | undefined => {
    if (!payload) {
        return undefined
    }

    const firstName = payload.first_name || ''
    const lastName = payload.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim()
    const authority = payload.authority || []

    return {
        userId: payload.id || payload.userId || '',
        avatar: payload.avatar || '',
        email: payload.email || '',
        userName: payload.userName || fullName || payload.email || '',
        firstName,
        lastName,
        rol: payload.rol || (authority.includes('admin') ? 'Administrador' : ''),
        authority,
    }
}

// Normaliza errores de autenticacion para mostrar mensajes en espanol.
const obtenerMensajeErrorAutenticacion = (
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    errors: any,
    fallback: string,
) => {
    const status = errors?.response?.status
    const detail = errors?.response?.data?.detail
    const message = errors?.response?.data?.message

    if (typeof detail === 'string' && detail.trim()) {
        return detail
    }

    if (typeof message === 'string' && message.trim()) {
        return message
    }

    if (status === 401) {
        return 'Credenciales inválidas.'
    }

    if (status === 403) {
        return 'No tienes permisos para acceder al panel administrativo.'
    }

    if (status === 500) {
        return 'Error interno del servidor. Inténtalo nuevamente en unos minutos.'
    }

    return fallback
}

function AuthProvider({ children }: AuthProviderProps) {
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const user = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)
    const setSessionSignedIn = useSessionUser(
        (state) => state.setSessionSignedIn,
    )
    const { token, setToken } = useToken()
    const [tokenState, setTokenState] = useState(token)

    const authenticated = Boolean(tokenState && signedIn)

    const navigatorRef = useRef<IsolatedNavigatorRef>(null)

    const redirect = () => {
        const search = window.location.search
        const params = new URLSearchParams(search)
        const redirectUrl = params.get(REDIRECT_URL_KEY)

        navigatorRef.current?.navigate(
            redirectUrl ? redirectUrl : appConfig.authenticatedEntryPath,
        )
    }

    const handleSignIn = (tokens: Token, user?: User) => {
        setToken(tokens.accessToken)
        setTokenState(tokens.accessToken)
        setSessionSignedIn(true)

        if (user) {
            setUser(user)
        }
    }

    useEffect(() => {
        let activo = true

        const sincronizarPerfil = async () => {
            if (!authenticated || !tokenState) {
                return
            }

            try {
                const perfil = await obtenerMiPerfil()

                if (!activo) {
                    return
                }

                setUser(construirUsuarioSesionDesdePerfil(perfil))
            } catch {
                // Si la sincronización falla, mantenemos la sesión actual
                // sin romper el flujo de navegación del usuario.
            }
        }

        sincronizarPerfil()

        return () => {
            activo = false
        }
    }, [authenticated, tokenState, setUser])

    const handleSignOut = () => {
        setToken('')
        setUser({})
        setSessionSignedIn(false)
    }

    const signIn = async (values: SignInCredential): AuthResult => {
        try {
            const resp = await apiSignIn(values)
            const accessToken = obtenerTokenDeRespuesta(resp)

            if (resp && accessToken) {
                handleSignIn(
                    { accessToken },
                    construirUsuarioSesion(resp.user),
                )
                redirect()
                return {
                    status: 'success',
                    message: '',
                }
            }
            return {
                status: 'failed',
                message: 'No fue posible iniciar sesion.',
            }
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            return {
                status: 'failed',
                message: obtenerMensajeErrorAutenticacion(
                    errors,
                    'No fue posible iniciar sesión. Inténtalo de nuevo.',
                ),
            }
        }
    }

    const signUp = async (values: SignUpCredential): AuthResult => {
        try {
            const resp = await apiSignUp(values)
            const accessToken = obtenerTokenDeRespuesta(resp)

            if (resp && accessToken) {
                handleSignIn(
                    { accessToken },
                    construirUsuarioSesion(resp.user),
                )
                redirect()
                return {
                    status: 'success',
                    message: '',
                }
            }
            return {
                status: 'failed',
                message: 'No fue posible registrar el usuario.',
            }
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            return {
                status: 'failed',
                message: obtenerMensajeErrorAutenticacion(
                    errors,
                    'No fue posible registrar el usuario.',
                ),
            }
        }
    }

    const signOut = async () => {
        try {
            await apiSignOut()
        } finally {
            handleSignOut()
            navigatorRef.current?.navigate('/')
        }
    }
    const oAuthSignIn = (
        callback: (payload: OauthSignInCallbackPayload) => void,
    ) => {
        callback({
            onSignIn: handleSignIn,
            redirect,
        })
    }

    return (
        <AuthContext.Provider
            value={{
                authenticated,
                user,
                signIn,
                signUp,
                signOut,
                oAuthSignIn,
            }}
        >
            {children}
            <IsolatedNavigator ref={navigatorRef} />
        </AuthContext.Provider>
    )
}

export default AuthProvider
